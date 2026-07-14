package com.sridhar.teams_backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "First Name is Required")
    private String firstName;

    @NotBlank(message = "Last Name is Required")
    private String lastName;

    @Email(message = "Email is not valid")
    @NotBlank(message = "Email is required")
    private String email;

    @Size(min = 8, message = "Password must contain at least 8 characters")
    private String password;

    @NotBlank(message = "Phone Number is required")
    @Size(min = 10, max = 10, message = "Phone Number must be 10 digits")
    private String phoneNumber;

    @NotBlank(message = "Job title is required")
    private String jobTitle;

    @NotBlank(message = "Department is required")
    private String department;
}