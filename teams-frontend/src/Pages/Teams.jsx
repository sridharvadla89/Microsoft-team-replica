import { useEffect, useState } from "react";

import {
    fetchTeams,
    saveTeam,
    editTeam,
    removeTeam
} from "../Services/TeamServices";

import Navbar from "../Components/Navbar";
import Sidebar from "../Components/SideBar";
import TeamCard from "../Components/TeamCard";
import TeamForm from "../Components/Teamform";
function Teams() {

    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);

    const [selectedTeam, setSelectedTeam] = useState(null);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {

            const response = await fetchTeams();

            setTeams(response.data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }
    };

    // Create Team
    const handleCreateTeam = async (team) => {

        try {

            await saveTeam(team);

            setShowForm(false);

            loadTeams();

        } catch (error) {

            console.error(error);

        }

    };

    // Update Team
    const handleUpdateTeam = async (team) => {

        try {

            await editTeam(selectedTeam.teamCode, team);

            setShowForm(false);

            setSelectedTeam(null);

            loadTeams();

        } catch (error) {

            console.error(error);

        }

    };

    // Edit Button
    const handleEdit = (team) => {

        setSelectedTeam(team);

        setShowForm(true);

    };

    // Delete Button
    const handleDelete = async (teamCode) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this team?"
        );

        if (!confirmDelete) return;

        try {

            await removeTeam(teamCode);

            loadTeams();

        } catch (error) {

            console.error(error);

        }

    };

    // Create Button
    const handleCreateClick = () => {

        setSelectedTeam(null);

        setShowForm(true);

    };

    if (loading) {

        return <h2>Loading Teams...</h2>;

    }

    return (

        <div>

            <Sidebar />

            <Navbar />

            <div
                style={{
                    marginLeft: "250px",
                    padding: "30px",
                    marginTop: "20px"
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "30px"
                    }}
                >

                    <h1>Teams</h1>

                    <button
                        onClick={handleCreateClick}
                        style={{
                            padding: "10px 20px",
                            background: "#1e0f13",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer"
                        }}
                    >
                        + Create Team
                    </button>

                </div>

                <hr />

                {teams.length === 0 ? (

                    <h3>No Teams Found</h3>

                ) : (

                    teams.map(team => (

                        <TeamCard
                            key={team.teamCode}
                            team={team}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />

                    ))

                )}

                {showForm && (

                    <TeamForm
                        initialData={selectedTeam}
                        onSave={
                            selectedTeam
                                ? handleUpdateTeam
                                : handleCreateTeam
                        }
                        onCancel={() => {
                            setShowForm(false);
                            setSelectedTeam(null);
                        }}
                    />

                )}

            </div>

        </div>

    );

}

export default Teams;