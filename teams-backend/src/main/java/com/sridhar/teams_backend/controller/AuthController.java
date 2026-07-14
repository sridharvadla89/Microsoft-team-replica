package com.sridhar.teams_backend.controller;

import com.sridhar.teams_backend.dto.request.LoginRequest;
import com.sridhar.teams_backend.dto.request.RegisterRequest;
import com.sridhar.teams_backend.dto.response.LoginResponse;
import com.sridhar.teams_backend.dto.response.UserResponse;
import com.sridhar.teams_backend.service.UserService;
import jakarta.validation.Valid;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    public AuthController(UserService userService){
        this.userService=userService;
    }
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid@RequestBody RegisterRequest registerRequest){
        UserResponse userResponse= userService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(userResponse);
    }
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        LoginResponse response = userService.login(request);

        return ResponseEntity.ok(response);
    }
}
