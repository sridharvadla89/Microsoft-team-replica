import { Routes, Route } from "react-router-dom";
import Teams from "../Pages/Teams";
import Login from"../Pages/Login";
import Register from "../Pages/Register";
import Dashboard from "../Pages/Dashboard";

function AppRoutes() {

    return (

        <Routes>

            <Route path="/" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/Teams" element={<Teams/>}/>

        </Routes>

    );

}

export default AppRoutes;