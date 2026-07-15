package com.sridhar.teams_backend.controller;

import com.sridhar.teams_backend.dto.request.InviteMemberRequest;
import com.sridhar.teams_backend.dto.request.UpdateRoleRequest;
import com.sridhar.teams_backend.dto.response.TeamMemberResponse;
import com.sridhar.teams_backend.service.MemberService;
import com.sridhar.teams_backend.service.impl.MemberServiceImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = {"http://localhost:5173"})
public class MemberController {
    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }
    @PostMapping("/{teamCode}/invite")
    public ResponseEntity<String> inviteMembers(@Valid @RequestBody InviteMemberRequest inviteMemberRequest,@PathVariable String teamCode){
        String message= memberService.inviteMembers(teamCode,inviteMemberRequest);
        return ResponseEntity.ok(message);

    }
    @GetMapping("/{teamCode}/invite")
    public ResponseEntity<List<TeamMemberResponse>> getMembers(@PathVariable String teamCode){
        return ResponseEntity.ok(memberService.getAllMembers(teamCode));
    }
    @DeleteMapping("/{teamCode}/members/{userId}")
    public ResponseEntity<String> removeMember(@PathVariable String teamCode,@PathVariable Long userId){
        return ResponseEntity.ok(memberService.removeMembers(teamCode, userId));
    }
    @PutMapping("/{teamCode}/members/{userId}/role")
    public ResponseEntity<String> updateRole(@PathVariable String teamCode, @PathVariable Long userId, @RequestBody @Valid UpdateRoleRequest request){
    return ResponseEntity.ok(memberService.updateRole(teamCode,userId,request));
    }
    @PostMapping("/{teamCode}/members/{userId}/leave")
    public ResponseEntity<String> leaveTeam(@PathVariable String teamCode,@PathVariable Long userId){
        return ResponseEntity.ok(memberService.leaveTeam(teamCode,userId));
    }
}
