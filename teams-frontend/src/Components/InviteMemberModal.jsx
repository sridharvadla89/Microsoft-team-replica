import { useState } from "react";

function InviteMemberModal({ onClose, onInvite }) {

    const [email, setEmail] = useState("");
    const [role, setRole] = useState("MEMBER");

    const handleSubmit = (e) => {
        e.preventDefault();

        onInvite({
            email,
            role
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">

            <div className="bg-white p-6 rounded-lg w-96">

                <h2 className="text-xl font-bold mb-4">
                    Invite Member
                </h2>

                <form onSubmit={handleSubmit}>

                    <input
                        type="email"
                        placeholder="Email"
                        className="border p-2 w-full mb-3"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                    />

                    <select
                        className="border p-2 w-full mb-4"
                        value={role}
                        onChange={(e)=>setRole(e.target.value)}
                    >
                        <option>MEMBER</option>
                        <option>ADMIN</option>
                    </select>

                    <div className="flex justify-end gap-2">

                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 px-4 py-2 rounded"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Invite
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default InviteMemberModal;