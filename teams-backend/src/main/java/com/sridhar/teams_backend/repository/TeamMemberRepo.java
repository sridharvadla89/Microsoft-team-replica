package com.sridhar.teams_backend.repository;

import com.sridhar.teams_backend.entity.Team;
import com.sridhar.teams_backend.entity.TeamMember;
import com.sridhar.teams_backend.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepo extends JpaRepository<TeamMember, Long> {

    List<TeamMember> findByTeam(Team team);

    List<TeamMember> findByUser(Users user);

    boolean existsByTeamAndUser(Team team, Users user);

    Optional<TeamMember> findByTeamAndUser(Team team, Users user);

    void deleteByTeamAndUser(Team team, Users user);
}