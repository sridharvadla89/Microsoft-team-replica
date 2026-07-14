package com.sridhar.teams_backend.exception;

public class PhoneAlreadyExistsException extends RuntimeException{
    public PhoneAlreadyExistsException(String message){
        super(message);
    }
}
