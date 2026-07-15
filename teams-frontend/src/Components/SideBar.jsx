import { Link } from "react-router-dom";

function Sidebar() {

    return (

        <div
            style={{
                width: "250px",
                height: "100vh",
                background: "#2F2F7F",
                color: "white",
                padding: "20px",
                position: "fixed",
                left: 0,
                top: 0
            }}
        >

            <h2>Teams App</h2>

            <hr />

            <nav>

                <p>
                    <Link
                        to="/dashboard"
                        style={{ color: "white", textDecoration: "none" }}
                    >
                        Dashboard
                    </Link>
                </p>

                <p>
                    <Link
                        to="/teams"
                        style={{ color: "white", textDecoration: "none" }}
                    >
                        Teams
                    </Link>
                </p>

                <p>
                    <Link
                        to="/chat"
                        style={{ color: "white", textDecoration: "none" }}
                    >
                        Personal Chat
                    </Link>
                </p>

                <p>
                    <Link
                        to="/group-chat"
                        style={{ color: "white", textDecoration: "none" }}
                    >
                        Group Chat
                    </Link>
                </p>

                <p>
                    <Link
                        to="/channels"
                        style={{ color: "white", textDecoration: "none" }}
                    >
                        Channels
                    </Link>
                </p>

                <p>
                    <Link
                        to="/members"
                        style={{ color: "white", textDecoration: "none" }}
                    >
                        Members
                    </Link>
                </p>

            </nav>

        </div>

    );

}

export default Sidebar;