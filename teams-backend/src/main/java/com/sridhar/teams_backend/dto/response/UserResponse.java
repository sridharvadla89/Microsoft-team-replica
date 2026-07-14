package com.sridhar.teams_backend.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserResponse {
    @Getter
    @Setter
    private Long id;
    @Getter
    @Setter
    private String FirstName;
    @Getter
    @Setter
    private String LastName;
    private String Email;
    private String PhoneNumber;
    private String Department;
    private String JobTitle;
    private String role;


}
