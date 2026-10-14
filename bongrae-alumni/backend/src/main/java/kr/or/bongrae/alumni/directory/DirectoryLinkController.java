package kr.or.bongrae.alumni.directory;

import java.util.Map;
import jakarta.validation.Valid;
import kr.or.bongrae.alumni.common.PageResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/admin/directory-links")
public class DirectoryLinkController {
    private final DirectoryLinkService service;
    public DirectoryLinkController(DirectoryLinkService service) { this.service=service; }
    @GetMapping
    public PageResponse<Map<String,Object>> list(@RequestParam(defaultValue="PENDING") String status,
        @RequestParam(defaultValue="") String name,@RequestParam(defaultValue="0") int page) {
        return service.list(status,name,page);
    }
    @GetMapping("/{userId}")
    public Map<String,Object> detail(@PathVariable long userId) { return service.detail(userId); }
    @PostMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void decide(@PathVariable long userId,@Valid @RequestBody DirectoryLinkService.Decision decision) { service.decide(userId,decision); }
}
