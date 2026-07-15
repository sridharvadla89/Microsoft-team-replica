package com.sridhar.teams_backend.controller;

import com.sridhar.teams_backend.dto.response.ChatGroupDto;
import com.sridhar.teams_backend.dto.response.ChatGroupMemberDto;
import com.sridhar.teams_backend.dto.response.MessageDto;
import com.sridhar.teams_backend.entity.Users;
import com.sridhar.teams_backend.service.ChatGroupService;
import com.sridhar.teams_backend.service.MessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class ChatGroupController {

    private final ChatGroupService chatGroupService;
    private final MessageService messageService;

    public ChatGroupController(ChatGroupService chatGroupService,
                               MessageService messageService) {
        this.chatGroupService = chatGroupService;
        this.messageService = messageService;
    }

    @PostMapping
    public ResponseEntity<ChatGroupDto> createGroup(@AuthenticationPrincipal Users currentUser,
                                                    @RequestBody Map<String, String> request) {
        String name = request.get("name");
        String description = request.get("description");
        
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        ChatGroupDto created = chatGroupService.createGroup(name, description, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<ChatGroupDto>> getUserGroups(@AuthenticationPrincipal Users currentUser) {
        return ResponseEntity.ok(chatGroupService.getUserGroups(currentUser.getId()));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<ChatGroupMemberDto>> getGroupMembers(@PathVariable Long groupId) {
        return ResponseEntity.ok(chatGroupService.getGroupMembers(groupId));
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<ChatGroupMemberDto> addMember(@AuthenticationPrincipal Users currentUser,
                                                        @PathVariable Long groupId,
                                                        @RequestBody Map<String, Long> request) {
        Long userId = request.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }

        ChatGroupMemberDto added = chatGroupService.addMember(groupId, userId, currentUser.getId());
        return ResponseEntity.ok(added);
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<String> removeOrLeaveMember(@AuthenticationPrincipal Users currentUser,
                                                      @PathVariable Long groupId,
                                                      @PathVariable Long userId) {
        if (currentUser.getId().equals(userId)) {
            // User is leaving the group
            chatGroupService.leaveGroup(groupId, userId);
            return ResponseEntity.ok("Left group successfully");
        } else {
            // Admin is removing a user
            chatGroupService.removeMember(groupId, userId, currentUser.getId());
            return ResponseEntity.ok("Removed member successfully");
        }
    }

    @PutMapping("/{groupId}/members/{userId}/admin")
    public ResponseEntity<String> promoteToAdmin(@AuthenticationPrincipal Users currentUser,
                                                 @PathVariable Long groupId,
                                                 @PathVariable Long userId) {
        chatGroupService.promoteToAdmin(groupId, userId, currentUser.getId());
        return ResponseEntity.ok("Promoted member to admin successfully");
    }

    @GetMapping("/{groupId}/history")
    public ResponseEntity<List<MessageDto>> getGroupHistory(@PathVariable Long groupId) {
        return ResponseEntity.ok(messageService.getGroupChatHistory(groupId));
    }

    @GetMapping("/{groupId}/search")
    public ResponseEntity<List<MessageDto>> searchGroupMessages(@PathVariable Long groupId,
                                                                @RequestParam String query) {
        return ResponseEntity.ok(messageService.searchGroupMessages(groupId, query));
    }
}
