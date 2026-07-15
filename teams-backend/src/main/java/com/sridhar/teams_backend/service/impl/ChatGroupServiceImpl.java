package com.sridhar.teams_backend.service.impl;

import com.sridhar.teams_backend.dto.response.ChatGroupDto;
import com.sridhar.teams_backend.dto.response.ChatGroupMemberDto;
import com.sridhar.teams_backend.entity.ChatGroup;
import com.sridhar.teams_backend.entity.ChatGroupMember;
import com.sridhar.teams_backend.entity.Users;
import com.sridhar.teams_backend.exception.ResourceNotFoundException;
import com.sridhar.teams_backend.repository.ChatGroupMemberRepo;
import com.sridhar.teams_backend.repository.ChatGroupRepo;
import com.sridhar.teams_backend.repository.UserRepo;
import com.sridhar.teams_backend.service.ChatGroupService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChatGroupServiceImpl implements ChatGroupService {

    private final ChatGroupRepo chatGroupRepo;
    private final ChatGroupMemberRepo chatGroupMemberRepo;
    private final UserRepo userRepo;

    public ChatGroupServiceImpl(ChatGroupRepo chatGroupRepo,
                                ChatGroupMemberRepo chatGroupMemberRepo,
                                UserRepo userRepo) {
        this.chatGroupRepo = chatGroupRepo;
        this.chatGroupMemberRepo = chatGroupMemberRepo;
        this.userRepo = userRepo;
    }

    @Override
    public ChatGroupDto createGroup(String name, String description, Long creatorId) {
        Users creator = userRepo.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Creator user not found"));

        ChatGroup group = ChatGroup.builder()
                .name(name)
                .description(description)
                .createdBy(creator)
                .build();

        ChatGroup savedGroup = chatGroupRepo.save(group);

        // Add creator as an admin member of the group
        ChatGroupMember membership = ChatGroupMember.builder()
                .group(savedGroup)
                .user(creator)
                .isAdmin(true)
                .build();

        chatGroupMemberRepo.save(membership);

        return mapToDto(savedGroup);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatGroupDto> getUserGroups(Long userId) {
        return chatGroupRepo.findGroupsByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatGroupMemberDto> getGroupMembers(Long groupId) {
        return chatGroupMemberRepo.findByGroupId(groupId).stream()
                .map(this::mapToMemberDto)
                .collect(Collectors.toList());
    }

    @Override
    public ChatGroupMemberDto addMember(Long groupId, Long userId, Long adminUserId) {
        // Enforce admin permission
        if (!isUserGroupAdmin(groupId, adminUserId)) {
            throw new RuntimeException("Only group admins can add members");
        }

        ChatGroup group = chatGroupRepo.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
        Users user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User to add not found"));

        Optional<ChatGroupMember> existing = chatGroupMemberRepo.findByGroupIdAndUserId(groupId, userId);
        if (existing.isPresent()) {
            return mapToMemberDto(existing.get());
        }

        ChatGroupMember membership = ChatGroupMember.builder()
                .group(group)
                .user(user)
                .isAdmin(false)
                .build();

        ChatGroupMember saved = chatGroupMemberRepo.save(membership);
        return mapToMemberDto(saved);
    }

    @Override
    public void removeMember(Long groupId, Long userId, Long adminUserId) {
        // Enforce admin permission (a user can't remove others unless they are admin)
        if (!isUserGroupAdmin(groupId, adminUserId)) {
            throw new RuntimeException("Only group admins can remove members");
        }

        ChatGroupMember membership = chatGroupMemberRepo.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Group membership not found"));

        chatGroupMemberRepo.delete(membership);
    }

    @Override
    public void promoteToAdmin(Long groupId, Long userId, Long adminUserId) {
        // Enforce admin permission
        if (!isUserGroupAdmin(groupId, adminUserId)) {
            throw new RuntimeException("Only group admins can promote members");
        }

        ChatGroupMember membership = chatGroupMemberRepo.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));

        membership.setIsAdmin(true);
        chatGroupMemberRepo.save(membership);
    }

    @Override
    public void leaveGroup(Long groupId, Long userId) {
        ChatGroupMember membership = chatGroupMemberRepo.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));

        chatGroupMemberRepo.delete(membership);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isUserGroupAdmin(Long groupId, Long userId) {
        Optional<ChatGroupMember> membership = chatGroupMemberRepo.findByGroupIdAndUserId(groupId, userId);
        return membership.isPresent() && membership.get().getIsAdmin();
    }

    private ChatGroupDto mapToDto(ChatGroup group) {
        return ChatGroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .createdById(group.getCreatedBy().getId())
                .createdByName(group.getCreatedBy().getFirstName() + " " + group.getCreatedBy().getLastName())
                .createdAt(group.getCreatedAt())
                .build();
    }

    private ChatGroupMemberDto mapToMemberDto(ChatGroupMember membership) {
        return ChatGroupMemberDto.builder()
                .id(membership.getId())
                .groupId(membership.getGroup().getId())
                .userId(membership.getUser().getId())
                .userName(membership.getUser().getFirstName() + " " + membership.getUser().getLastName())
                .userEmail(membership.getUser().getEmail())
                .isAdmin(membership.getIsAdmin())
                .joinedAt(membership.getJoinedAt())
                .build();
    }
}
