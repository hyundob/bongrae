package kr.or.bongrae.alumni.directory;

import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import kr.or.bongrae.alumni.common.PageResponse;

@RestController
public class DirectoryController {
    private final DirectoryService service;
    public DirectoryController(DirectoryService service) { this.service=service; }
    @GetMapping("/api/alumni")
    public PageResponse<Map<String,Object>> search(@RequestParam(defaultValue="") String name, @RequestParam(required=false) Integer classNo, @RequestParam(defaultValue="0") int page) {
        return service.search(name,classNo,page,false);
    }
    @GetMapping("/api/admin/directory")
    public PageResponse<Map<String,Object>> list(@RequestParam(defaultValue="") String name, @RequestParam(required=false) Integer classNo, @RequestParam(defaultValue="0") int page) {
        return service.search(name,classNo,page,true);
    }
    @PostMapping("/api/admin/directory")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public Map<String,Long> create(@Valid @RequestBody DirectoryService.RecordInput input) { return Map.of("id",service.save(null,input)); }
    @PutMapping("/api/admin/directory/{id}")
    public Map<String,Long> update(@PathVariable long id, @Valid @RequestBody DirectoryService.RecordInput input) { return Map.of("id",service.save(id,input)); }
    @DeleteMapping("/api/admin/directory/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) { service.delete(id); }
}
