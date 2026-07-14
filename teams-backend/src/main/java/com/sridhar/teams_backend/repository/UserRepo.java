package com.sridhar.teams_backend.repository;

import com.sridhar.teams_backend.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepo extends JpaRepository<Users,Long> {
    Optional<Users> findByEmail(String email);

    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
}
