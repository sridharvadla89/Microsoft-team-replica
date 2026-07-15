import api from "./axios";

// Get all members
export const getMembers = (teamCode) =>
    api.get(`/teams/${teamCode}/invite`);

// Invite Member
export const inviteMember = (teamCode, data) =>
    api.post(`/teams/${teamCode}/invite`, data);

// Remove Member
export const removeMember = (teamCode, userId) =>
    api.delete(`/teams/${teamCode}/members/${userId}`);

// Update Role
export const updateRole = (teamCode, userId, data) =>
    api.put(`/teams/${teamCode}/members/${userId}/role`, data);