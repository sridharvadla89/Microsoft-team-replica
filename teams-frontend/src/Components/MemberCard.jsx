function MemberCard({
    member,
    onRemove,
    onRoleChange
}) {

    return (
        <div className="flex justify-between items-center bg-white shadow rounded-lg p-4 mb-3">

            <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {member.name.charAt(0).toUpperCase()}
                </div>

                <div>
                    <h3 className="font-semibold">
                        {member.name}
                    </h3>

                    <p className="text-gray-500">
                        {member.email}
                    </p>
                </div>

            </div>

            <div className="flex items-center gap-3">

                <select
                    value={member.role}
                    onChange={(e)=>
                        onRoleChange(member.id,e.target.value)
                    }
                    className="border rounded px-2 py-1"
                >
                    <option value="OWNER">OWNER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MEMBER">MEMBER</option>
                </select>

                <button
                    onClick={()=>onRemove(member.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                >
                    Remove
                </button>

            </div>

        </div>
    );
}

export default MemberCard;