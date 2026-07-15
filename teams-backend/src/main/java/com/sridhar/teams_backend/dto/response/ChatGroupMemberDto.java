package com.sridhar.teams_backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatGroupMemberDto {
    private Long id;
    private Long groupId;
    private Long userId;
    private String userName;
    private String userEmail;
    private Boolean isAdmin;
    private LocalDateTime joinedAt;
}
