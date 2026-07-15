package com.sridhar.teams_backend.service;

import com.sridhar.teams_backend.dto.request.LoginRequest;
import com.sridhar.teams_backend.dto.request.RegisterRequest;
import com.sridhar.teams_backend.dto.response.LoginResponse;
import com.sridhar.teams_backend.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse register(RegisterRequest request);
    LoginResponse login(LoginRequest request);
    List<UserResponse> getAllUsers(Long currentUserId);
    UserResponse getUserById(Long userId);
}
