package com.sridhar.teams_backend.exception;


import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
@Setter
@Getter
public class ErrorResponse {
private LocalDateTime timestamp;
private int status;
private String message;

    public ErrorResponse() {
    }

    public ErrorResponse(LocalDateTime timestamp,
                         int status,
                         String message) {
        this.timestamp = timestamp;
        this.status = status;
        this.message = message;
    }

}