package com.sridhar.teams_backend.service.impl;

import com.sridhar.teams_backend.dto.request.LoginRequest;
import com.sridhar.teams_backend.dto.request.RegisterRequest;
import com.sridhar.teams_backend.dto.response.LoginResponse;
import com.sridhar.teams_backend.dto.response.UserResponse;
import com.sridhar.teams_backend.entity.Role;
import com.sridhar.teams_backend.entity.Users;
import com.sridhar.teams_backend.exception.EmailAlreadyExistsException;
import com.sridhar.teams_backend.exception.PhoneAlreadyExistsException;
import com.sridhar.teams_backend.exception.ResourceNotFoundException;
import com.sridhar.teams_backend.repository.RoleRepo;
import com.sridhar.teams_backend.repository.UserRepo;
import com.sridhar.teams_backend.security.JwtService;
import com.sridhar.teams_backend.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserServiceImpl(UserRepo userRepo,
                           RoleRepo roleRepo,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    public UserResponse register(RegisterRequest request) {

        // Check Email
        if (userRepo.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        // Check Phone Number
        if (userRepo.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new PhoneAlreadyExistsException("Phone Number already exists");
        }

        // Default Role
        Role role = roleRepo.findByName("EMPLOYEE")
                .orElseThrow(() ->
                        new ResourceNotFoundException("Default role is not present"));

        // Create User
        Users user = new Users();

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());   // ✅ Fixed
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setDepartment(request.getDepartment());
        user.setJobTitle(request.getJobTitle());
        user.setEnabled(true);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Save User
        Users savedUser = userRepo.save(user);

        // Response
        UserResponse response = new UserResponse();

        response.setId(savedUser.getId());
        response.setFirstName(savedUser.getFirstName());
        response.setLastName(savedUser.getLastName());
        response.setEmail(savedUser.getEmail());
        response.setPhoneNumber(savedUser.getPhoneNumber());
        response.setDepartment(savedUser.getDepartment());
        response.setJobTitle(savedUser.getJobTitle());
        response.setRole(savedUser.getRole().getName());

        return response;
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        Users user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Invalid Email or Password"));

        // ✅ Fixed Password Check
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResourceNotFoundException("Invalid Email or Password");
        }

        return new LoginResponse(
                jwtService.generateTokens(user.getEmail()),
                "Bearer",
                user.getEmail(),
                user.getRole().getName()
        );
    }
}