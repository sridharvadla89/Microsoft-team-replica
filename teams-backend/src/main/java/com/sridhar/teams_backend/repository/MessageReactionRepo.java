package com.sridhar.teams_backend.repository;

import com.sridhar.teams_backend.entity.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MessageReactionRepo extends JpaRepository<MessageReaction, Long> {
    Optional<MessageReaction> findByMessageIdAndUserId(Long messageId, Long userId);
}
