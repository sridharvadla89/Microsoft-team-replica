package com.sridhar.teams_backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name="teams")
public class Team {
    @Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable=false)
private String teamName;
    @Column(nullable = false,unique = true)
private String teamCode;
    @Column(nullable = false,length = 1000)
private String description;
private LocalDateTime createdAt;
private LocalDateTime updatedAt;
}
