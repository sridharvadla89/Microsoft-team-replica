package com.sridhar.teams_backend.service.impl;

import com.sridhar.teams_backend.dto.response.MessageDto;
import com.sridhar.teams_backend.dto.response.MessageReactionDto;
import com.sridhar.teams_backend.entity.ChatGroup;
import com.sridhar.teams_backend.entity.ChatGroupMember;
import com.sridhar.teams_backend.entity.Message;
import com.sridhar.teams_backend.entity.MessageReaction;
import com.sridhar.teams_backend.entity.Users;
import com.sridhar.teams_backend.exception.ResourceNotFoundException;
import com.sridhar.teams_backend.repository.ChatGroupMemberRepo;
import com.sridhar.teams_backend.repository.ChatGroupRepo;
import com.sridhar.teams_backend.repository.MessageReactionRepo;
import com.sridhar.teams_backend.repository.MessageRepo;
import com.sridhar.teams_backend.repository.UserRepo;
import com.sridhar.teams_backend.service.MessageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class MessageServiceImpl implements MessageService {

    private final MessageRepo messageRepo;
    private final MessageReactionRepo messageReactionRepo;
    private final UserRepo userRepo;
    private final ChatGroupRepo chatGroupRepo;
    private final ChatGroupMemberRepo chatGroupMemberRepo;

    public MessageServiceImpl(MessageRepo messageRepo,
                              MessageReactionRepo messageReactionRepo,
                              UserRepo userRepo,
                              ChatGroupRepo chatGroupRepo,
                              ChatGroupMemberRepo chatGroupMemberRepo) {
        this.messageRepo = messageRepo;
        this.messageReactionRepo = messageReactionRepo;
        this.userRepo = userRepo;
        this.chatGroupRepo = chatGroupRepo;
        this.chatGroupMemberRepo = chatGroupMemberRepo;
    }

    @Override
    public MessageDto sendMessage(Long senderId, Long receiverId, String content, String mediaUrl, String mediaType) {
        Users sender = userRepo.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        Users receiver = userRepo.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType)
                .timestamp(LocalDateTime.now())
                .status("SENT")
                .build();

        Message saved = messageRepo.save(message);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDto> getChatHistory(Long userA, Long userB) {
        return messageRepo.findConversation(userA, userB).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDto> searchMessages(Long userA, Long userB, String query) {
        return messageRepo.searchConversation(userA, userB, query).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public void markAsRead(Long senderId, Long receiverId) {
        messageRepo.markAsRead(senderId, receiverId);
    }

    @Override
    public MessageDto addReaction(Long messageId, Long userId, String emoji) {
        Message message = messageRepo.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        Users user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Optional<MessageReaction> existing = messageReactionRepo.findByMessageIdAndUserId(messageId, userId);
        if (existing.isPresent()) {
            MessageReaction reaction = existing.get();
            reaction.setEmoji(emoji);
            messageReactionRepo.save(reaction);
        } else {
            MessageReaction reaction = MessageReaction.builder()
                    .message(message)
                    .user(user)
                    .emoji(emoji)
                    .build();
            messageReactionRepo.save(reaction);
        }

        Message updatedMessage = messageRepo.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        return mapToDto(updatedMessage);
    }

    @Override
    public MessageDto removeReaction(Long messageId, Long userId) {
        Optional<MessageReaction> existing = messageReactionRepo.findByMessageIdAndUserId(messageId, userId);
        existing.ifPresent(messageReactionRepo::delete);

        Message updatedMessage = messageRepo.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        return mapToDto(updatedMessage);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Long> getUnreadCounts(Long userId) {
        List<Object[]> results = messageRepo.countUnreadMessagesBySender(userId);
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] result : results) {
            Long senderId = (Long) result[0];
            Long count = (Long) result[1];
            counts.put(senderId, count);
        }
        return counts;
    }

    @Override
    public MessageDto sendGroupMessage(Long senderId, Long groupId, String content, String mediaUrl, String mediaType) {
        Users sender = userRepo.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        ChatGroup group = chatGroupRepo.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(null)
                .group(group)
                .content(content)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType)
                .timestamp(LocalDateTime.now())
                .status("SENT")
                .build();

        Message saved = messageRepo.save(message);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDto> getGroupChatHistory(Long groupId) {
        return messageRepo.findGroupConversation(groupId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDto> searchGroupMessages(Long groupId, String query) {
        return messageRepo.searchGroupConversation(groupId, query).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public MessageDto togglePinMessage(Long messageId, Long userId) {
        Message message = messageRepo.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (message.getGroup() == null) {
            throw new RuntimeException("Can only pin group chat messages");
        }

        Long groupId = message.getGroup().getId();
        ChatGroupMember member = chatGroupMemberRepo.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("User is not a member of the group"));

        if (!member.getIsAdmin()) {
            throw new RuntimeException("Only group admins can pin messages");
        }

        message.setIsPinned(!message.getIsPinned());
        Message saved = messageRepo.save(message);
        return mapToDto(saved);
    }

    private MessageDto mapToDto(Message message) {
        List<MessageReactionDto> reactionDtos = message.getReactions() != null ? message.getReactions().stream()
                .map(r -> MessageReactionDto.builder()
                        .id(r.getId())
                        .userId(r.getUser().getId())
                        .userName(r.getUser().getFirstName() + " " + r.getUser().getLastName())
                        .emoji(r.getEmoji())
                        .build())
                .collect(Collectors.toList()) : List.of();

        Long receiverId = message.getReceiver() != null ? message.getReceiver().getId() : null;
        String receiverName = message.getReceiver() != null 
                ? (message.getReceiver().getFirstName() + " " + message.getReceiver().getLastName()) 
                : null;
        Long groupId = message.getGroup() != null ? message.getGroup().getId() : null;

        return MessageDto.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFirstName() + " " + message.getSender().getLastName())
                .receiverId(receiverId)
                .receiverName(receiverName)
                .content(message.getContent())
                .mediaUrl(message.getMediaUrl())
                .mediaType(message.getMediaType())
                .timestamp(message.getTimestamp())
                .status(message.getStatus())
                .groupId(groupId)
                .isPinned(message.getIsPinned())
                .reactions(reactionDtos)
                .build();
    }
}
