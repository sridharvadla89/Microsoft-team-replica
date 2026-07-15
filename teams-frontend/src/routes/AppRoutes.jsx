import { Routes, Route } from "react-router-dom";

import Login from "../Pages/Login";
import Register from "../Pages/Register";
import Dashboard from "../Pages/Dashboard";
import Teams from "../Pages/Teams";
import TeamMembers from "../Pages/TeamMembers";

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/teams" element={<Teams />} />

            {/* Add this route */}
            <Route
                path="/teams/:teamCode/members"
                element={<TeamMembers />}
            />
        </Routes>
    );
}

export default AppRoutes;