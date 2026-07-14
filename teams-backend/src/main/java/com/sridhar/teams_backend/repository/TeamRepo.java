package com.sridhar.teams_backend.repository;

import com.sridhar.teams_backend.dto.response.TeamResponse;
import com.sridhar.teams_backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeamRepo extends JpaRepository<Team,Long> {
    Optional<Team> findByTeamCode(String teamCode);


}
