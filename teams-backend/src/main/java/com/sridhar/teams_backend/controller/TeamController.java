package com.sridhar.teams_backend.controller;

import com.sridhar.teams_backend.dto.request.TeamRequest;
import com.sridhar.teams_backend.dto.response.TeamResponse;
import com.sridhar.teams_backend.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin("http://localhost:5173")

public class TeamController {
    private final TeamService teamService;
    public TeamController(TeamService teamService){
        this.teamService=teamService;
    }
    @GetMapping
    public ResponseEntity<List<TeamResponse>> getAllTeams(){
return ResponseEntity.ok(teamService.getAllTeams());
    }
    @PostMapping
    public ResponseEntity<TeamResponse> createTeam(@Valid @RequestBody TeamRequest teamRequest){
        return new ResponseEntity<>(teamService.createTeam(teamRequest), HttpStatus.CREATED);
    }
    @GetMapping("/{teamCode}")
    public ResponseEntity<TeamResponse> getTeam(
            @PathVariable String teamCode) {

        return ResponseEntity.ok(
                teamService.getTeam(teamCode));

    }
    @PutMapping("/{teamCode}")
public ResponseEntity<TeamResponse> updateTeam(@PathVariable String teamCode,@RequestBody TeamRequest request){
        return ResponseEntity.ok(teamService.updateTeam(teamCode,request));
}
@DeleteMapping("/{teamCode}")
    public ResponseEntity<String> deleteTeams(@PathVariable String teamCode){
        teamService.deleteItems(teamCode);
        return ResponseEntity.ok("Team is Deleted");
}
}
