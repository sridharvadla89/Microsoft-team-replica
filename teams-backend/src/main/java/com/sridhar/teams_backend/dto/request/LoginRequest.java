package com.sridhar.teams_backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    @Email
    @NotBlank(message = "Invalid email")
    private String email;
    @NotBlank(message = "Invalid password")
    private String password;


}
