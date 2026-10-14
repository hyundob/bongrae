package kr.or.bongrae.alumni.board;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import kr.or.bongrae.alumni.auth.CurrentUser;

@Service
public class MediaService {
    public record FileData(byte[] bytes,String type) {}
    private final JdbcTemplate db;
    private final CurrentUser current;
    public MediaService(JdbcTemplate db,CurrentUser current) { this.db=db; this.current=current; }
    @Transactional public Map<String,Object> upload(MultipartFile file) throws IOException {
        var user=current.require();
        if (file.isEmpty() || file.getSize()>16*1024*1024) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"파일은 16MB 이하여야 합니다.");
        db.update("DELETE FROM board_media WHERE post_id IS NULL AND created_at<now()-interval '24 hours'");
        long pending=db.queryForObject("SELECT count(*) FROM board_media WHERE uploader_id=? AND post_id IS NULL",Long.class,user.getId());
        if (pending>=10) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"미사용 첨부파일을 삭제한 뒤 다시 시도해 주세요.");
        byte[] bytes=file.getBytes();
        String type;
        try { type=detect(bytes); }
        catch (IOException error) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"손상되었거나 지원하지 않는 파일입니다."); }
        String filename=Optional.ofNullable(file.getOriginalFilename()).orElse("attachment").replace('\\','/');
        filename=filename.substring(filename.lastIndexOf('/')+1).replaceAll("[\\p{Cntrl}]","");
        if (filename.isBlank()) filename="attachment";
        if (filename.length()>200) filename=filename.substring(filename.length()-200);
        UUID id=UUID.randomUUID();
        db.update("INSERT INTO board_media(id,uploader_id,filename,content_type,byte_size,content) VALUES (?,?,?,?,?,?)",id,user.getId(),filename,type,bytes.length,bytes);
        return Map.of("id",id,"filename",filename,"content_type",type,"byte_size",bytes.length);
    }
    private String detect(byte[] bytes) throws IOException {
        if (bytes.length>=12 && new String(bytes,4,4,StandardCharsets.US_ASCII).equals("ftyp")) {
            String brand=new String(bytes,8,4,StandardCharsets.US_ASCII);
            if (Set.of("isom","iso2","mp41","mp42","avc1","M4V ").contains(brand)) return "video/mp4";
        }
        try(var input=ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers=ImageIO.getImageReaders(input);
            if (readers.hasNext()) {
                var reader=readers.next();
                try {
                    reader.setInput(input);
                    String format=reader.getFormatName().toLowerCase(Locale.ROOT);
                    if (Set.of("png","jpeg").contains(format) && (long)reader.getWidth(0)*reader.getHeight(0)<=40000000)
                        return format.equals("png")?"image/png":"image/jpeg";
                } finally { reader.dispose(); }
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"PNG, JPEG 이미지 또는 MP4 영상만 첨부할 수 있습니다.");
    }
    @Transactional(readOnly=true) public FileData get(UUID id) {
        var rows=db.queryForList("SELECT post_id,uploader_id,content_type,content FROM board_media WHERE id=?",id);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        var row=rows.getFirst();
        if (row.get("post_id")==null && !Objects.equals(row.get("uploader_id"),current.require().getId())) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return new FileData((byte[])row.get("content"),(String)row.get("content_type"));
    }
    @Transactional public void discard(UUID id) {
        db.update("DELETE FROM board_media WHERE id=? AND uploader_id=? AND post_id IS NULL",id,current.require().getId());
    }
    void attach(long post,List<UUID> ids,long actor) {
        if (new HashSet<>(ids).size()!=ids.size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        // Lock each upload so two concurrent submissions cannot attach the same file.
        for (UUID id:ids) {
            var rows=db.queryForList("SELECT post_id,uploader_id FROM board_media WHERE id=? FOR UPDATE",id);
            if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"첨부파일을 찾을 수 없습니다.");
            var row=rows.getFirst();
            if (!Objects.equals(row.get("post_id"),post) && !(row.get("post_id")==null && Objects.equals(row.get("uploader_id"),actor)))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,"첨부파일을 사용할 권한이 없습니다.");
        }
        var old=db.queryForList("SELECT id FROM board_media WHERE post_id=?",UUID.class,post);
        for(UUID id:old) if(!ids.contains(id)) db.update("DELETE FROM board_media WHERE id=?",id);
        for(UUID id:ids) db.update("UPDATE board_media SET post_id=? WHERE id=?",post,id);
    }
}
