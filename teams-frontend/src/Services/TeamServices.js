import * as teamApi from "../api/teamAPis";

export const fetchTeams = async () => {
    return await teamApi.getTeams();
};

export const saveTeam = async (team) => {
    return await teamApi.createTeam(team);
};

export const editTeam = async (teamCode, team) => {
    return await teamApi.updateTeam(teamCode, team);
};

export const removeTeam = async (teamCode) => {
    return await teamApi.deleteTeam(teamCode);
};