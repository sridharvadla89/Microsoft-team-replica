import api from "./axios";

export const registerUser = (userData) => {
    return api.post("/auth/register", userData);
};

export const loginUser = (loginData) => {
    return api.post("/auth/login", loginData);
};