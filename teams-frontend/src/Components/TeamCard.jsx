function TeamCard({ team, onEdit, onDelete }) {

    return (

        <div
            style={{
                background: "#fff",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "20px",
                boxShadow: "0 2px 8px rgba(43, 17, 103, 0.1)"
            }}
        >

            <h2>{team.teamName}</h2>

            <p>{team.description}</p>

            <p>

                <strong>Team Code :</strong>

                {team.teamCode}

            </p>

            <div
                style={{
                    marginTop: "20px"
                }}
            >

                <button
                    onClick={() => onEdit(team)}
                    style={{
                        marginRight: "10px"
                    }}
                >
                    Edit
                </button>

                <button
                    onClick={() => onDelete(team.teamCode)}
                >
                    Delete
                </button>

            </div>

        </div>

    );

}

export default TeamCard;