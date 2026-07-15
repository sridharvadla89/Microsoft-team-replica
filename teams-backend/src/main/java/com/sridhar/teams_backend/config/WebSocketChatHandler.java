package com.sridhar.teams_backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sridhar.teams_backend.dto.response.MessageDto;
import com.sridhar.teams_backend.entity.Users;
import com.sridhar.teams_backend.repository.UserRepo;
import com.sridhar.teams_backend.security.JwtService;
import com.sridhar.teams_backend.service.MessageService;
import com.sridhar.teams_backend.service.ChatGroupService;
import com.sridhar.teams_backend.dto.response.ChatGroupMemberDto;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketChatHandler extends TextWebSocketHandler {

    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final MessageService messageService;
    private final ChatGroupService chatGroupService;
    private final ObjectMapper objectMapper;

    // Map to keep track of active sessions: userId -> WebSocketSession
    private final ConcurrentHashMap<Long, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    public WebSocketChatHandler(JwtService jwtService,
                                UserRepo userRepo,
                                MessageService messageService,
                                ChatGroupService chatGroupService,
                                ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
        this.messageService = messageService;
        this.chatGroupService = chatGroupService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String query = session.getUri().getQuery();
        String token = getQueryParam(query, "token");

        if (token == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        try {
            String email = jwtService.getEmailFromToken(token);
            Optional<Users> userOpt = userRepo.findByEmail(email);

            if (userOpt.isPresent()) {
                Users user = userOpt.get();
                session.getAttributes().put("userId", user.getId());
                userSessions.put(user.getId(), session);
                
                // Notify user they are connected successfully and send online users
                Map<String, Object> ack = new HashMap<>();
                ack.put("type", "CONNECTION_ACK");
                ack.put("userId", user.getId());
                ack.put("onlineUsers", new java.util.ArrayList<>(userSessions.keySet()));
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ack)));

                // Broadcast online status to others
                Map<String, Object> statusMsg = new HashMap<>();
                statusMsg.put("type", "USER_STATUS");
                statusMsg.put("userId", user.getId());
                statusMsg.put("status", "ONLINE");
                String statusJson = objectMapper.writeValueAsString(statusMsg);
                for (Map.Entry<Long, WebSocketSession> entry : userSessions.entrySet()) {
                    if (!entry.getKey().equals(user.getId()) && entry.getValue().isOpen()) {
                        entry.getValue().sendMessage(new TextMessage(statusJson));
                    }
                }
            } else {
                session.close(CloseStatus.BAD_DATA);
            }
        } catch (Exception e) {
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long senderId = (Long) session.getAttributes().get("userId");
        if (senderId == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        try {
            String payload = message.getPayload();
            Map<String, Object> data = objectMapper.readValue(payload, Map.class);
            String type = (String) data.get("type");

            if ("CHAT".equals(type)) {
                Number receiverIdNum = (Number) data.get("receiverId");
                if (receiverIdNum == null) return;
                Long receiverId = receiverIdNum.longValue();

                String content = (String) data.get("content");
                String mediaUrl = (String) data.get("mediaUrl");
                String mediaType = (String) data.get("mediaType");

                // Save message to database
                MessageDto messageDto = messageService.sendMessage(senderId, receiverId, content, mediaUrl, mediaType);

                Map<String, Object> wsResponse = new HashMap<>();
                wsResponse.put("type", "CHAT");
                wsResponse.put("message", messageDto);

                String jsonResponse = objectMapper.writeValueAsString(wsResponse);
                TextMessage textMessage = new TextMessage(jsonResponse);

                // Send back to sender as acknowledgment
                session.sendMessage(textMessage);

                // Send to receiver if online
                WebSocketSession receiverSession = userSessions.get(receiverId);
                if (receiverSession != null && receiverSession.isOpen()) {
                    receiverSession.sendMessage(textMessage);
                }
            } else if ("TYPING".equals(type)) {
                Number receiverIdNum = (Number) data.get("receiverId");
                if (receiverIdNum == null) return;
                Long receiverId = receiverIdNum.longValue();

                Boolean isTyping = (Boolean) data.get("isTyping");
                if (isTyping == null) isTyping = false;

                WebSocketSession receiverSession = userSessions.get(receiverId);
                if (receiverSession != null && receiverSession.isOpen()) {
                    Map<String, Object> wsResponse = new HashMap<>();
                    wsResponse.put("type", "TYPING");
                    wsResponse.put("senderId", senderId);
                    wsResponse.put("isTyping", isTyping);
                    receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(wsResponse)));
                }
            } else if ("READ_RECEIPT".equals(type)) {
                // The client sends a READ_RECEIPT when they view the conversation.
                // receiverId here is the person whose messages the current user has read.
                Number originalSenderIdNum = (Number) data.get("receiverId");
                if (originalSenderIdNum == null) return;
                Long originalSenderId = originalSenderIdNum.longValue();

                // Mark messages in DB as read
                messageService.markAsRead(originalSenderId, senderId);

                // Notify original sender that their messages were read
                WebSocketSession originalSenderSession = userSessions.get(originalSenderId);
                if (originalSenderSession != null && originalSenderSession.isOpen()) {
                    Map<String, Object> wsResponse = new HashMap<>();
                    wsResponse.put("type", "READ_RECEIPT");
                    wsResponse.put("readerId", senderId); // who read the messages
                    originalSenderSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(wsResponse)));
                }
            } else if ("REACTION".equals(type)) {
                Number messageIdNum = (Number) data.get("messageId");
                if (messageIdNum == null) return;
                Long messageId = messageIdNum.longValue();

                String emoji = (String) data.get("emoji");
                Number receiverIdNum = (Number) data.get("receiverId");
                if (receiverIdNum == null) return;
                Long receiverId = receiverIdNum.longValue();

                MessageDto updatedMessage;
                if (emoji == null || emoji.trim().isEmpty()) {
                    updatedMessage = messageService.removeReaction(messageId, senderId);
                } else {
                    updatedMessage = messageService.addReaction(messageId, senderId, emoji);
                }

                Map<String, Object> wsResponse = new HashMap<>();
                wsResponse.put("type", "REACTION");
                wsResponse.put("message", updatedMessage);

                String jsonResponse = objectMapper.writeValueAsString(wsResponse);
                TextMessage textMessage = new TextMessage(jsonResponse);

                // Send to sender
                session.sendMessage(textMessage);

                // Send to receiver if online
                WebSocketSession receiverSession = userSessions.get(receiverId);
                if (receiverSession != null && receiverSession.isOpen()) {
                    receiverSession.sendMessage(textMessage);
                }
            } else if ("GROUP_CHAT".equals(type)) {
                Number groupIdNum = (Number) data.get("groupId");
                if (groupIdNum == null) return;
                Long groupId = groupIdNum.longValue();

                String content = (String) data.get("content");
                String mediaUrl = (String) data.get("mediaUrl");
                String mediaType = (String) data.get("mediaType");

                // Save message
                MessageDto messageDto = messageService.sendGroupMessage(senderId, groupId, content, mediaUrl, mediaType);

                Map<String, Object> wsResponse = new HashMap<>();
                wsResponse.put("type", "GROUP_CHAT");
                wsResponse.put("message", messageDto);

                String jsonResponse = objectMapper.writeValueAsString(wsResponse);
                TextMessage textMessage = new TextMessage(jsonResponse);

                // Broadcast to all online members of the group
                List<ChatGroupMemberDto> members = chatGroupService.getGroupMembers(groupId);
                for (ChatGroupMemberDto member : members) {
                    WebSocketSession memberSession = userSessions.get(member.getUserId());
                    if (memberSession != null && memberSession.isOpen()) {
                        memberSession.sendMessage(textMessage);
                    }
                }
            } else if ("GROUP_TYPING".equals(type)) {
                Number groupIdNum = (Number) data.get("groupId");
                if (groupIdNum == null) return;
                Long groupId = groupIdNum.longValue();

                Boolean isTyping = (Boolean) data.get("isTyping");
                if (isTyping == null) isTyping = false;

                // Find sender's name
                String senderName = "Someone";
                Optional<Users> senderOpt = userRepo.findById(senderId);
                if (senderOpt.isPresent()) {
                    senderName = senderOpt.get().getFirstName() + " " + senderOpt.get().getLastName();
                }

                Map<String, Object> wsResponse = new HashMap<>();
                wsResponse.put("type", "GROUP_TYPING");
                wsResponse.put("groupId", groupId);
                wsResponse.put("senderId", senderId);
                wsResponse.put("senderName", senderName);
                wsResponse.put("isTyping", isTyping);

                String jsonResponse = objectMapper.writeValueAsString(wsResponse);
                TextMessage textMessage = new TextMessage(jsonResponse);

                List<ChatGroupMemberDto> members = chatGroupService.getGroupMembers(groupId);
                for (ChatGroupMemberDto member : members) {
                    if (!member.getUserId().equals(senderId)) {
                        WebSocketSession memberSession = userSessions.get(member.getUserId());
                        if (memberSession != null && memberSession.isOpen()) {
                            memberSession.sendMessage(textMessage);
                        }
                    }
                }
            } else if ("PIN_MESSAGE".equals(type)) {
                Number messageIdNum = (Number) data.get("messageId");
                if (messageIdNum == null) return;
                Long messageId = messageIdNum.longValue();

                MessageDto updatedMessage = messageService.togglePinMessage(messageId, senderId);

                Map<String, Object> wsResponse = new HashMap<>();
                wsResponse.put("type", "PIN_MESSAGE");
                wsResponse.put("message", updatedMessage);

                String jsonResponse = objectMapper.writeValueAsString(wsResponse);
                TextMessage textMessage = new TextMessage(jsonResponse);

                List<ChatGroupMemberDto> members = chatGroupService.getGroupMembers(updatedMessage.getGroupId());
                for (ChatGroupMemberDto member : members) {
                    WebSocketSession memberSession = userSessions.get(member.getUserId());
                    if (memberSession != null && memberSession.isOpen()) {
                        memberSession.sendMessage(textMessage);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId != null) {
            userSessions.remove(userId);
            
            // Broadcast offline status to others
            Map<String, Object> statusMsg = new HashMap<>();
            statusMsg.put("type", "USER_STATUS");
            statusMsg.put("userId", userId);
            statusMsg.put("status", "OFFLINE");
            String statusJson = objectMapper.writeValueAsString(statusMsg);
            for (WebSocketSession s : userSessions.values()) {
                if (s.isOpen()) {
                    s.sendMessage(new TextMessage(statusJson));
                }
            }
        }
    }

    private String getQueryParam(String query, String paramName) {
        if (query == null) return null;
        for (String pair : query.split("&")) {
            String[] entry = pair.split("=");
            if (entry.length > 1 && entry[0].equals(paramName)) {
                return entry[1];
            }
        }
        return null;
    }
}
