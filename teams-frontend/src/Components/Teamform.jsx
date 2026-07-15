import { useEffect, useState } from "react";

function TeamForm({ initialData, onSave, onCancel }) {

    const [team, setTeam] = useState({
        teamName: "",
        description: ""
    });

    useEffect(() => {

        if (initialData) {

            setTeam({
                teamName: initialData.teamName,
                description: initialData.description
            });

        }

    }, [initialData]);

    const handleChange = (e) => {

        setTeam({
            ...team,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        onSave(team);

    };

    return (

        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
            }}
        >

            <div
                style={{
                    background: "#fff",
                    padding: "30px",
                    borderRadius: "10px",
                    width: "400px"
                }}
            >

                <h2>
                    {initialData ? "Edit Team" : "Create Team"}
                </h2>

                <form onSubmit={handleSubmit}>

                    <div style={{ marginBottom: "15px" }}>

                        <label>Team Name</label>

                        <input
                            type="text"
                            name="teamName"
                            value={team.teamName}
                            onChange={handleChange}
                            required
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "5px"
                            }}
                        />

                    </div>

                    <div style={{ marginBottom: "15px" }}>

                        <label>Description</label>

                        <textarea
                            name="description"
                            value={team.description}
                            onChange={handleChange}
                            rows="4"
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "5px"
                            }}
                        />

                    </div>

                    <button
                        type="submit"
                        style={{
                            background: "#4B49AC",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            marginRight: "10px",
                            cursor: "pointer"
                        }}
                    >
                        {initialData ? "Update Team" : "Create Team"}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            padding: "10px 20px",
                            cursor: "pointer"
                        }}
                    >
                        Cancel
                    </button>

                </form>

            </div>

        </div>

    );

}

export default TeamForm;