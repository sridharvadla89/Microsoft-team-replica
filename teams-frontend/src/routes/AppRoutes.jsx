import { Routes, Route } from "react-router-dom";

import Login from "../Pages/Login";
import Register from "../Pages/Register";
import Dashboard from "../Pages/Dashboard";
import Teams from "../Pages/Teams";
import TeamMembers from "../Pages/TeamMembers";
import Chat from "../Pages/Chat";
import GroupChat from "../Pages/GroupChat";

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/group-chat" element={<GroupChat />} />

            {/* Add this route */}
            <Route
                path="/teams/:teamCode/members"
                element={<TeamMembers />}
            />
        </Routes>
    );
}

export default AppRoutes;