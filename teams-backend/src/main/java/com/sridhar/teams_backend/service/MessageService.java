package com.sridhar.teams_backend.service;

import com.sridhar.teams_backend.dto.response.MessageDto;

import java.util.List;
import java.util.Map;

public interface MessageService {
    MessageDto sendMessage(Long senderId, Long receiverId, String content, String mediaUrl, String mediaType);
    List<MessageDto> getChatHistory(Long userA, Long userB);
    List<MessageDto> searchMessages(Long userA, Long userB, String query);
    void markAsRead(Long senderId, Long receiverId);
    MessageDto addReaction(Long messageId, Long userId, String emoji);
    MessageDto removeReaction(Long messageId, Long userId);
    Map<Long, Long> getUnreadCounts(Long userId);
    MessageDto sendGroupMessage(Long senderId, Long groupId, String content, String mediaUrl, String mediaType);
    List<MessageDto> getGroupChatHistory(Long groupId);
    List<MessageDto> searchGroupMessages(Long groupId, String query);
    MessageDto togglePinMessage(Long messageId, Long userId);
}
