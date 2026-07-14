import api from "./axios";
export const getTeams=()=>{ return api.get('/teams')};
export const getTeam = (teamCode) =>
    api.get(`/teams/${teamCode}`);

export const createTeam = (team) =>
    api.post("/teams", team);

export const updateTeam = (teamCode, team) =>
    api.put(`/teams/${teamCode}`, team);

export const deleteTeam = (teamCode) =>
    api.delete(`/teams/${teamCode}`);
