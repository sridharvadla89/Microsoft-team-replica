package com.sridhar.teams_backend.dto.response;

import com.sridhar.teams_backend.entity.Role;
import com.sridhar.teams_backend.entity.enums.MemberRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TeamMemberResponse {
    private Long id;
    private String name;
    private String email;
    private MemberRole role;
}
