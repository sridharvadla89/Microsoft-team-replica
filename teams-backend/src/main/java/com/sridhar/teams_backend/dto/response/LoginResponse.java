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
    public LoginResponse(){

    }
    public LoginResponse(String accessToken,String tokenType,String email,String role){
        this.accessToken=accessToken;
        this.tokenType=tokenType;
        this.email=email;
        this.role=role;
    }
}
