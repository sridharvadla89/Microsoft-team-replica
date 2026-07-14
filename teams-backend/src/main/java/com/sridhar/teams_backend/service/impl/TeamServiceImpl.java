package com.sridhar.teams_backend.service.impl;

import com.sridhar.teams_backend.dto.request.TeamRequest;
import com.sridhar.teams_backend.dto.response.TeamResponse;
import com.sridhar.teams_backend.entity.Team;
import com.sridhar.teams_backend.repository.TeamRepo;
import com.sridhar.teams_backend.service.TeamService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
@Service
public class TeamServiceImpl implements TeamService {
    private final TeamRepo teamRepo;
    public TeamServiceImpl(TeamRepo teamRepo){
        this.teamRepo=teamRepo;
    }

    @Override
    public TeamResponse createTeam(TeamRequest request) {
        Team team=Team.builder().teamName(request.getTeamName()).
                teamCode(generateTeamCode()).description(request.getDescription())
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        Team Saveteam=teamRepo.save(team);

        return TeamResponse.builder().
                id(Saveteam.getId()).teamName(Saveteam.getTeamName()).
                description(Saveteam.getDescription()).
                teamCode(Saveteam.getTeamCode()).build();
    }
    private TeamResponse mapToResponse(Team team) {

        return TeamResponse.builder()
                .id(team.getId())
                .teamName(team.getTeamName())
                .description(team.getDescription())
                .teamCode(team.getTeamCode())
                .build();

    }
    @Override
    public List<TeamResponse> getAllTeams() {

        return teamRepo.findAll().stream()
                .map(team -> TeamResponse.builder()
                        .id(team.getId())
                        .teamName(team.getTeamName())
                        .description(team.getDescription())
                        .teamCode(team.getTeamCode())
                        .build())
                .toList();
    }
    public String generateTeamCode(){
        return UUID.randomUUID().toString().substring(0,8).toUpperCase();
    }


    @Override
    public TeamResponse updateTeam(String teamCode,
                                   TeamRequest request) {

        Team team = teamRepo.findByTeamCode(teamCode)
                .orElseThrow(() ->
                        new RuntimeException("Team not found"));

        team.setTeamName(request.getTeamName());

        team.setDescription(request.getDescription());

        team.setUpdatedAt(LocalDateTime.now());

        Team updatedTeam = teamRepo.save(team);

        return mapToResponse(updatedTeam);

    }

    @Override
    public void deleteItems(String teamCode) {
        Team team = teamRepo.findByTeamCode(teamCode)
                .orElseThrow(() ->
                        new RuntimeException("Team not found"));

        teamRepo.delete(team);
    }
    @Override
    public TeamResponse getTeam(String teamCode) {

        Team team = teamRepo.findByTeamCode(teamCode)
                .orElseThrow(() ->
                        new RuntimeException("Team not found"));

        return mapToResponse(team);
    }
    }
