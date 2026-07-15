package com.sridhar.teams_backend.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponse {
    private String accessToken;
    private String tokenType;
    private String email;
    private String role;
    private Long id;
    private String firstName;
    private String lastName;

    public LoginResponse() {
    }

    public LoginResponse(String accessToken, String tokenType, String email, String role, Long id, String firstName, String lastName) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.email = email;
        this.role = role;
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
    }
}
