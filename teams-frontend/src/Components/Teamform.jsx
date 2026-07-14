import { useState } from "react";

function TeamForm({ onSave, onCancel }) {

    const [teamName, setTeamName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = (e) => {

        e.preventDefault();

        onSave({
            teamName,
            description
        });

        setTeamName("");
        setDescription("");
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
                    width: "450px",
                    background: "white",
                    borderRadius: "10px",
                    padding: "25px"
                }}
            >

                <h2>Create Team</h2>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        placeholder="Team Name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginBottom: "15px"
                        }}
                    />

                    <textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                        style={{
                            width: "100%",
                            padding: "10px"
                        }}
                    />

                    <div
                        style={{
                            marginTop: "20px",
                            display: "flex",
                            justifyContent: "space-between"
                        }}
                    >

                        <button
                            type="button"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>

                        <button type="submit">

                            Create Team

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}

export default TeamForm;