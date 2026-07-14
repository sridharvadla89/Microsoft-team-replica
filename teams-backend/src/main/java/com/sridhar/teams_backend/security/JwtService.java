package com.sridhar.teams_backend.security;

import com.sridhar.teams_backend.service.impl.UserServiceImpl;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {
    private static final String SECRET =
            "ThisIsMyVerySecretKeyForJwtAuthentication123456789";
    private final SecretKey key =
            Keys.hmacShaKeyFor(SECRET.getBytes());
    public String generateTokens(String email){
        return Jwts.builder().subject(email).issuedAt(new Date()).expiration(new Date(System.currentTimeMillis()+86400000)).signWith(key).compact();
    }
}
