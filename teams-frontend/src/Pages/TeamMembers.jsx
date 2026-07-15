import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../Components/Navbar";
import Sidebar from "../Components/SideBar";
import MemberCard from "../Components/MemberCard";
import InviteMemberModal from "../Components/InviteMemberModal";
import {
    getMembers,
    removeMember,
    updateRole
} from "../api/memberApi";

function TeamMembers() {

    const { teamCode } = useParams();
    const navigate = useNavigate();

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadMembers();
    }, [teamCode]);

    const loadMembers = async () => {

        try {

            setLoading(true);

            const response = await getMembers(teamCode);

            setMembers(response.data);

        } catch (error) {

            console.log(error);

        } finally {

            setLoading(false);

        }

    };

    const handleRemove = async (userId) => {

        if (!window.confirm("Remove this member?"))
            return;

        await removeMember(teamCode, userId);

        loadMembers();

    };

    const handleRoleChange = async (userId, role) => {

        await updateRole(teamCode, userId, { role });

        loadMembers();

    };

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.email.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <div>

            <Sidebar />

            <Navbar />

            <div
                style={{
                    marginLeft: "250px",
                    marginTop: "20px",
                    padding: "30px"
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "25px"
                    }}
                >

                    <button
                        onClick={() => navigate("/teams")}
                        style={{
                            padding: "10px 18px",
                            background: "#4f46e5",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer"
                        }}
                    >
                        ← Back
                    </button>

                    <button
                        onClick={() => setShowInvite(true)}
                        style={{
                            padding: "10px 18px",
                            background: "#16a34a",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer"
                        }}
                    >
                        + Invite Member
                    </button>

                </div>

                <h2>Team Members</h2>

                <input
                    type="text"
                    placeholder="Search Member..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: "20px",
                        marginBottom: "20px",
                        borderRadius: "5px",
                        border: "1px solid #ccc"
                    }}
                />

                {loading ? (

                    <h3>Loading...</h3>

                ) : filteredMembers.length === 0 ? (

                    <h3>No Members Found</h3>

                ) : (

                    filteredMembers.map(member => (

                        <MemberCard
                            key={member.id}
                            member={member}
                            onRemove={handleRemove}
                            onRoleChange={handleRoleChange}
                        />

                    ))

                )}

{showInvite && (
    <InviteMemberModal
        onClose={() => setShowInvite(false)}
        onInvite={async (data) => {
            try {
                await inviteMember(teamCode, data);

                alert("Member Invited Successfully");

                setShowInvite(false);

                loadMembers();

            } catch (error) {
                alert(
                    error.response?.data?.message ||
                    "Unable to invite member"
                );
            }
        }}
    />
)}

            </div>

        </div>

    );

}

export default TeamMembers;