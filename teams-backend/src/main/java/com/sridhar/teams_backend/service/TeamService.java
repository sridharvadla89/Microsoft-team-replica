package com.sridhar.teams_backend.service;

import com.sridhar.teams_backend.dto.request.TeamRequest;
import com.sridhar.teams_backend.dto.response.TeamResponse;
import jakarta.validation.Valid;
import org.springframework.stereotype.Service;

import java.util.List;

public interface TeamService {
    TeamResponse createTeam(@Valid TeamRequest request);
    List<TeamResponse> getAllTeams();
    TeamResponse updateTeam(String TeamCode,@Valid TeamRequest request);
    TeamResponse getTeam(String teamCode);
    void deleteItems(String TeamCode);
}
