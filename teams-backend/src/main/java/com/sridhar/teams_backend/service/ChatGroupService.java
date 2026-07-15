package com.sridhar.teams_backend.service;

import com.sridhar.teams_backend.dto.response.ChatGroupDto;
import com.sridhar.teams_backend.dto.response.ChatGroupMemberDto;

import java.util.List;

public interface ChatGroupService {
    ChatGroupDto createGroup(String name, String description, Long creatorId);
    List<ChatGroupDto> getUserGroups(Long userId);
    List<ChatGroupMemberDto> getGroupMembers(Long groupId);
    ChatGroupMemberDto addMember(Long groupId, Long userId, Long adminUserId);
    void removeMember(Long groupId, Long userId, Long adminUserId);
    void promoteToAdmin(Long groupId, Long userId, Long adminUserId);
    void leaveGroup(Long groupId, Long userId);
    boolean isUserGroupAdmin(Long groupId, Long userId);
}
