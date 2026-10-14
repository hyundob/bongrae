package kr.or.bongrae.alumni.board;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import kr.or.bongrae.alumni.common.PageResponse;

@RestController
public class BoardController {
    private final BoardService boards;
    private final MediaService media;
    public BoardController(BoardService boards,MediaService media) { this.boards=boards; this.media=media; }
    @GetMapping("/api/boards/{board}/posts")
    public PageResponse<Map<String,Object>> list(@PathVariable String board,@RequestParam(defaultValue="") String q,@RequestParam(defaultValue="0") int page) { return boards.list(board,q,page); }
    @GetMapping("/api/boards/{board}/posts/{id}")
    public Map<String,Object> detail(@PathVariable String board,@PathVariable long id) { return boards.detail(board,id); }
    @PostMapping("/api/boards/{board}/posts") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Long> create(@PathVariable String board,@Valid @RequestBody BoardService.PostInput input) { return Map.of("id",boards.save(board,null,input)); }
    @PutMapping("/api/boards/{board}/posts/{id}")
    public Map<String,Long> update(@PathVariable String board,@PathVariable long id,@Valid @RequestBody BoardService.PostInput input) { return Map.of("id",boards.save(board,id,input)); }
    @DeleteMapping("/api/boards/{board}/posts/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String board,@PathVariable long id,@RequestParam long version) { boards.delete(board,id,version); }
    @PostMapping("/api/media") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> upload(@RequestParam MultipartFile file) throws IOException { return media.upload(file); }
    @GetMapping("/api/media/{id}")
    public ResponseEntity<Resource> get(@PathVariable UUID id) {
        var file=media.get(id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.type())).cacheControl(CacheControl.noStore()).header("X-Content-Type-Options","nosniff").body(new ByteArrayResource(file.bytes()));
    }
    @DeleteMapping("/api/media/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void discard(@PathVariable UUID id) { media.discard(id); }
}
