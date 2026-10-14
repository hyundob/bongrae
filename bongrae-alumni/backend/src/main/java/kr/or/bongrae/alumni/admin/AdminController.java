package kr.or.bongrae.alumni.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;
import kr.or.bongrae.alumni.common.PageResponse;
import kr.or.bongrae.alumni.member.MemberRole;

@RestController
@RequestMapping("/api/admin/members")
public class AdminController {
    private final AdminService service;
    public AdminController(AdminService service) { this.service=service; }
    public record RoleInput(@NotNull MemberRole role) {}
    @GetMapping public PageResponse<AdminService.Member> list(@RequestParam(defaultValue="") String name,@RequestParam(defaultValue="0") int page) { return service.members(name,page); }
    @PatchMapping("/{id}/role") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void role(@PathVariable long id,@Valid @RequestBody RoleInput input) { service.role(id,input.role()); }
}
