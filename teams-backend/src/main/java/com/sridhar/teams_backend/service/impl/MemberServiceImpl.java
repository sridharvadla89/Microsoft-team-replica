package com.sridhar.teams_backend.service.impl;

import com.sridhar.teams_backend.dto.request.InviteMemberRequest;
import com.sridhar.teams_backend.dto.request.UpdateRoleRequest;
import com.sridhar.teams_backend.dto.response.TeamMemberResponse;
import com.sridhar.teams_backend.entity.Team;
import com.sridhar.teams_backend.entity.TeamMember;
import com.sridhar.teams_backend.entity.Users;
import com.sridhar.teams_backend.entity.enums.MemberRole;
import com.sridhar.teams_backend.repository.TeamMemberRepo;
import com.sridhar.teams_backend.repository.TeamRepo;
import com.sridhar.teams_backend.repository.UserRepo;
import com.sridhar.teams_backend.service.MemberService;
import org.aspectj.weaver.Member;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MemberServiceImpl implements MemberService {
    private final TeamMemberRepo teamMemberRepo;
    private final UserRepo userRepo;
    private final TeamRepo teamRepo;
    public MemberServiceImpl(TeamMemberRepo teamMemberRepo,UserRepo userRepo,TeamRepo teamRepo){
        this.teamMemberRepo=teamMemberRepo;
        this.userRepo=userRepo;
        this.teamRepo=teamRepo;
    }
    @Override
    public String inviteMembers(String teamCode, InviteMemberRequest inviteMemberRequest) {
        Team team=teamRepo.findByTeamCode(teamCode).orElseThrow(()->new RuntimeException("TeamCode is Invalid "));
        Users user=userRepo.findByEmail(inviteMemberRequest.getEmail()).orElseThrow(()->new RuntimeException("Invalid Email"));
        if(teamMemberRepo.existsByTeamAndUser(team,user)){
          throw new RuntimeException("User is already exists");
        }TeamMember teamMember=TeamMember.builder().team(team).user(user).role(MemberRole.valueOf(inviteMemberRequest.getRole())).build();
        teamMemberRepo.save(teamMember);
        return "Member invited sucessfully";
    }

    @Override
    public List<TeamMemberResponse> getAllMembers(String teamCode) {
        Team team=teamRepo.findByTeamCode(teamCode).orElseThrow(()->new RuntimeException("Invalid TeamCode"));
        List<TeamMember> members=teamMemberRepo.findByTeam(team);
        return members.stream().map(member->TeamMemberResponse.builder().id(member.getUser().getId())
                .name(member.getUser().getName()).email(member.getUser().getEmail()).role(member.getRole())
                .build()).toList();
    }
    @Override
    public String removeMembers(String teamCode,Long id){
        Team team=teamRepo.findByTeamCode(teamCode).orElseThrow(()->new RuntimeException("Invalid TeamCode"));
        Users user=userRepo.findById(id).orElseThrow(()->new RuntimeException("User not found"));
        TeamMember member=teamMemberRepo.findByTeamAndUser(team,user).orElseThrow(()->new RuntimeException("Member is not found"));
        if(member.getRole()==MemberRole.OWNER){
            throw new RuntimeException("Owner is not removed");
        }
        teamMemberRepo.delete(member);
        return "Successfully member is removed ";
    }
    @Override
    public String updateRole(String teamCode, Long userId, UpdateRoleRequest request){
        Team team=teamRepo.findByTeamCode(teamCode).orElseThrow(()->new RuntimeException("Invalid TeamCode"));
        Users user=userRepo.findById(userId).orElseThrow(()->new RuntimeException("User is Not found"));
        TeamMember member=teamMemberRepo.findByTeamAndUser(team,user).orElseThrow(()->new RuntimeException("Members is not found"));
        member.setRole(MemberRole.valueOf(request.getRole()));
        teamMemberRepo.save(member);
        return "Member role updated successfully";
    }
    @Override
    public String leaveTeam(String teamCode,Long id){
        Team team=teamRepo.findByTeamCode(teamCode).orElseThrow(()->new RuntimeException("Team is nto found"));
        Users user=userRepo.findById(id).orElseThrow(()->new RuntimeException("User is not found"));
        TeamMember teamMember=teamMemberRepo.findByTeamAndUser(team,user).orElseThrow(()->new RuntimeException("Time is not found"));
        if(teamMember.getRole()==MemberRole.MEMBER){
            throw new RuntimeException("Owner cannot be removed");
        }
        teamMemberRepo.delete(teamMember);
        return "left successfully";
    }
}
