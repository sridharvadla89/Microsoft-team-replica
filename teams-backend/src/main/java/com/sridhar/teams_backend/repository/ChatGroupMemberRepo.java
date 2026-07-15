package com.sridhar.teams_backend.repository;

import com.sridhar.teams_backend.entity.ChatGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatGroupMemberRepo extends JpaRepository<ChatGroupMember, Long> {
    Optional<ChatGroupMember> findByGroupIdAndUserId(Long groupId, Long userId);
    List<ChatGroupMember> findByGroupId(Long groupId);
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);
}
