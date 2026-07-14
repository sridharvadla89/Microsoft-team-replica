package com.sridhar.teams_backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeamResponse {
    private Long id;
    private String description;
    private String teamName;
    private String teamCode;
}
