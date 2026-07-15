package com.sridhar.teams_backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InviteMemberRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "InValid Email")
    private String email;
    @NotBlank(message = "Role is Required")
    private String Role;
}
