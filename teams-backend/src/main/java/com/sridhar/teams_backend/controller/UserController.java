package com.sridhar.teams_backend.controller;

import com.sridhar.teams_backend.dto.response.UserResponse;
import com.sridhar.teams_backend.entity.Users;
import com.sridhar.teams_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(@AuthenticationPrincipal Users currentUser) {
        return ResponseEntity.ok(userService.getAllUsers(currentUser.getId()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal Users currentUser) {
        return ResponseEntity.ok(userService.getUserById(currentUser.getId()));
    }
}
