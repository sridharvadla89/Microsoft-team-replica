package com.sridhar.teams_backend.service;

import com.sridhar.teams_backend.dto.request.InviteMemberRequest;
import com.sridhar.teams_backend.dto.request.UpdateRoleRequest;
import com.sridhar.teams_backend.dto.response.TeamMemberResponse;

import java.util.List;

public interface MemberService {
    String inviteMembers(String teamCode, InviteMemberRequest inviteMemberRequest);
    List<TeamMemberResponse> getAllMembers(String teamCode);
    String removeMembers(String teamCode,Long userId);
    String updateRole(String teamCode, Long userId, UpdateRoleRequest request);
    String leaveTeam(String teamCode,Long id);
}
