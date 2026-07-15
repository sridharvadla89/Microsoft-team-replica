package com.sridhar.teams_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private Long id;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private String receiverName;
    private String content;
    private String mediaUrl;
    private String mediaType;
    private LocalDateTime timestamp;
    private String status; // "SENT", "READ"
    private Long groupId;
    private Boolean isPinned;
    private List<MessageReactionDto> reactions;
}
