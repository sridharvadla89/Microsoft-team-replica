package com.sridhar.teams_backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TeamRequest {
    @NotBlank(message = "Invalid Team Name")
    private String teamName;
    @NotBlank(message = "Description is needed")
    private String description;
}
