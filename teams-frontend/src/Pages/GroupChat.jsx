import { useState, useEffect, useRef } from "react";
import Sidebar from "../Components/SideBar";
import Navbar from "../Components/Navbar";
import api from "../api/axios";

function GroupChat() {
    const [groups, setGroups] = useState([]);
    const [activeGroup, setActiveGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]); // All users list
    const [groupMembers, setGroupMembers] = useState([]); // Members of active group
    
    // UI Panels toggles
    const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
    const [showFilesDrawer, setShowFilesDrawer] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

    // Modal forms
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDesc, setNewGroupDesc] = useState("");
    const [inviteUserId, setInviteUserId] = useState("");

    // Message search
    const [searchMessageQuery, setSearchMessageQuery] = useState("");
    const [searchActive, setSearchActive] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const [textInput, setTextInput] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    
    // Group typing states
    const [typingUsers, setTypingUsers] = useState({}); // { [userId]: { name, timestamp } }
    const typingTimeoutRef = useRef(null);
    const isTypingSentRef = useRef(false);

    // Media states
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef(null);

    // WebSocket state
    const [ws, setWs] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);

    const messagesEndRef = useRef(null);

    // 1. Initial Data Fetching
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch logged-in user profile
                const profileRes = await api.get("/users/me");
                setCurrentUser(profileRes.data);
                setCurrentUserId(profileRes.data.id);

                // Fetch other users (for group invitation list)
                const usersRes = await api.get("/users");
                setContacts(usersRes.data);

                // Fetch groups
                const groupsRes = await api.get("/groups");
                setGroups(groupsRes.data);
            } catch (err) {
                console.error("Error fetching group chat data:", err);
            }
        };

        fetchInitialData();
    }, []);

    // 2. Establish WebSocket Connection
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        let socket;
        let reconnectInterval;

        const connect = () => {
            socket = new WebSocket(`ws://localhost:8081/ws/chat?token=${token}`);

            socket.onopen = () => {
                console.log("Group WebSocket connected");
                setWsConnected(true);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === "GROUP_CHAT") {
                        const newMsg = data.message;
                        if (activeGroup && newMsg.groupId === activeGroup.id) {
                            setMessages((prev) => {
                                if (prev.some((m) => m.id === newMsg.id)) return prev;
                                return [...prev, newMsg];
                            });
                        }
                    } else if (data.type === "GROUP_TYPING") {
                        if (activeGroup && data.groupId === activeGroup.id) {
                            setTypingUsers((prev) => {
                                const updated = { ...prev };
                                if (data.isTyping) {
                                    updated[data.senderId] = {
                                        name: data.senderName,
                                        timestamp: Date.now()
                                    };
                                } else {
                                    delete updated[data.senderId];
                                }
                                return updated;
                            });
                        }
                    } else if (data.type === "REACTION") {
                        const updatedMsg = data.message;
                        if (activeGroup && updatedMsg.groupId === activeGroup.id) {
                            setMessages((prev) =>
                                prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
                            );
                        }
                    } else if (data.type === "PIN_MESSAGE") {
                        const updatedMsg = data.message;
                        if (activeGroup && updatedMsg.groupId === activeGroup.id) {
                            setMessages((prev) =>
                                prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
                            );
                        }
                    }
                } catch (e) {
                    console.error("Error parsing group WebSocket message:", e);
                }
            };

            socket.onclose = () => {
                console.log("Group WebSocket disconnected. Reconnecting...");
                setWsConnected(false);
                reconnectInterval = setTimeout(connect, 3000);
            };

            setWs(socket);
        };

        connect();

        return () => {
            if (socket) socket.close();
            if (reconnectInterval) clearTimeout(reconnectInterval);
        };
    }, [activeGroup, currentUserId]);

    // 3. Clear typing users on active group change or expiry
    useEffect(() => {
        setTypingUsers({});
    }, [activeGroup]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setTypingUsers((prev) => {
                const updated = { ...prev };
                let changed = false;
                Object.entries(updated).forEach(([userId, info]) => {
                    if (now - info.timestamp > 3000) {
                        delete updated[userId];
                        changed = true;
                    }
                });
                return changed ? updated : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // 4. Fetch Group messages & members on active group change
    useEffect(() => {
        if (!activeGroup) return;

        const fetchGroupDetails = async () => {
            try {
                // Fetch group history
                const messagesRes = await api.get(`/groups/${activeGroup.id}/history`);
                setMessages(messagesRes.data);

                // Fetch group members
                const membersRes = await api.get(`/groups/${activeGroup.id}/members`);
                setGroupMembers(membersRes.data);

                setSearchActive(false);
                setSearchMessageQuery("");
            } catch (err) {
                console.error("Error fetching group details:", err);
            }
        };

        fetchGroupDetails();
    }, [activeGroup]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 5. Create New Group
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        try {
            const res = await api.post("/groups", {
                name: newGroupName,
                description: newGroupDesc
            });

            setGroups((prev) => [...prev, res.data]);
            setActiveGroup(res.data);
            
            // Clean up modal
            setNewGroupName("");
            setNewGroupDesc("");
            setShowCreateGroupModal(false);
        } catch (err) {
            console.error("Error creating group:", err);
            alert("Failed to create group.");
        }
    };

    // 6. Member Management Operations
    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!inviteUserId || !activeGroup) return;

        try {
            const res = await api.post(`/groups/${activeGroup.id}/members`, {
                userId: parseInt(inviteUserId)
            });
            setGroupMembers((prev) => [...prev, res.data]);
            setInviteUserId("");
            alert("Member added successfully!");
        } catch (err) {
            console.error("Error adding member:", err);
            alert("Failed to add member. Only group admins can add members.");
        }
    };

    const handlePromoteMember = async (userId) => {
        if (!activeGroup) return;
        try {
            await api.put(`/groups/${activeGroup.id}/members/${userId}/admin`);
            setGroupMembers((prev) =>
                prev.map((m) => (m.userId === userId ? { ...m, isAdmin: true } : m))
            );
            alert("Promoted member to Admin successfully!");
        } catch (err) {
            console.error("Error promoting member:", err);
            alert("Failed to promote member. Only group admins can promote.");
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!activeGroup) return;
        if (!window.confirm("Are you sure you want to remove this member?")) return;

        try {
            await api.delete(`/groups/${activeGroup.id}/members/${userId}`);
            setGroupMembers((prev) => prev.filter((m) => m.userId !== userId));
            alert("Removed member successfully!");
        } catch (err) {
            console.error("Error removing member:", err);
            alert("Failed to remove member. Only group admins can remove.");
        }
    };

    const handleLeaveGroup = async () => {
        if (!activeGroup) return;
        if (!window.confirm("Are you sure you want to leave this group?")) return;

        try {
            await api.delete(`/groups/${activeGroup.id}/members/${currentUserId}`);
            setGroups((prev) => prev.filter((g) => g.id !== activeGroup.id));
            setActiveGroup(null);
            setShowSettingsDrawer(false);
            alert("You have left the group.");
        } catch (err) {
            console.error("Error leaving group:", err);
            alert("Failed to leave group.");
        }
    };

    // Check if current user is admin in active group
    const isCurrentUserAdmin = () => {
        if (!activeGroup) return false;
        const membership = groupMembers.find((m) => m.userId === currentUserId);
        return membership ? membership.isAdmin : false;
    };

    // 7. Group Typing Broadcast
    const handleInputChange = (e) => {
        setTextInput(e.target.value);

        if (!activeGroup || !ws || ws.readyState !== WebSocket.OPEN) return;

        if (!isTypingSentRef.current) {
            isTypingSentRef.current = true;
            ws.send(JSON.stringify({
                type: "GROUP_TYPING",
                groupId: activeGroup.id,
                isTyping: true
            }));
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            ws.send(JSON.stringify({
                type: "GROUP_TYPING",
                groupId: activeGroup.id,
                isTyping: false
            }));
            isTypingSentRef.current = false;
        }, 2500);
    };

    // 8. Send Message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!textInput.trim() || !activeGroup || !ws || ws.readyState !== WebSocket.OPEN) return;

        // Clear typing indicator
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        ws.send(JSON.stringify({
            type: "GROUP_TYPING",
            groupId: activeGroup.id,
            isTyping: false
        }));
        isTypingSentRef.current = false;

        // Send group message
        ws.send(JSON.stringify({
            type: "GROUP_CHAT",
            groupId: activeGroup.id,
            content: textInput
        }));

        setTextInput("");
    };

    // 9. File Upload
    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeGroup || !ws || ws.readyState !== WebSocket.OPEN) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setUploadingFile(true);
            const res = await api.post("/messages/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            const { url, fileName, mediaType } = res.data;

            // Send via WebSocket
            ws.send(JSON.stringify({
                type: "GROUP_CHAT",
                groupId: activeGroup.id,
                content: `Shared file: ${fileName}`,
                mediaUrl: url,
                mediaType: mediaType
            }));
        } catch (err) {
            console.error("Error uploading file:", err);
            alert("Failed to upload file.");
        } finally {
            setUploadingFile(false);
            e.target.value = "";
        }
    };

    // 10. Message Reactions
    const handleReact = (messageId, emoji) => {
        if (!activeGroup || !ws || ws.readyState !== WebSocket.OPEN) return;

        const msg = messages.find((m) => m.id === messageId);
        const existingReaction = msg?.reactions?.find((r) => r.userId === currentUserId);
        const finalEmoji = existingReaction && existingReaction.emoji === emoji ? "" : emoji;

        ws.send(JSON.stringify({
            type: "REACTION",
            messageId: messageId,
            emoji: finalEmoji,
            receiverId: activeGroup.id // pass receiverId mapping in WS (receiverId is reused on socket router if receiverId exists)
        }));
    };

    // 11. Pin/Unpin Message
    const handleTogglePin = (messageId) => {
        if (!activeGroup || !ws || ws.readyState !== WebSocket.OPEN) return;

        ws.send(JSON.stringify({
            type: "PIN_MESSAGE",
            messageId: messageId
        }));
    };

    // 12. Search Group Messages
    const handleSearchMessages = async (e) => {
        e.preventDefault();
        if (!searchMessageQuery.trim() || !activeGroup) return;

        try {
            const res = await api.get(`/groups/${activeGroup.id}/search`, {
                params: {
                    query: searchMessageQuery
                }
            });
            setSearchResults(res.data);
            setSearchActive(true);
        } catch (err) {
            console.error("Error searching messages:", err);
        }
    };

    const clearMessageSearch = () => {
        setSearchMessageQuery("");
        setSearchActive(false);
        setSearchResults([]);
    };

    // Helper for Group Dates
    const getFormattedDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    };

    const groupMessagesByDate = (msgList) => {
        const groups = {};
        msgList.forEach((msg) => {
            const dateKey = getFormattedDate(msg.timestamp);
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(msg);
        });
        return groups;
    };

    const displayedMessages = searchActive ? searchResults : messages;

    // Filter shared files: messages that have media attachments
    const sharedFiles = messages.filter((m) => m.mediaUrl != null);

    // Latest pinned message in group
    const pinnedMessage = messages.slice().reverse().find((m) => m.isPinned);

    // Get list of users who are not yet members of the group
    const nonMembers = contacts.filter((c) =>
        !groupMembers.some((m) => m.userId === c.id)
    );

    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Navbar */}
            <Navbar />

            {/* Main Group Layout Container */}
            <div className="flex flex-1 ml-[250px] mt-[80px] h-[calc(100vh-80px)] overflow-hidden">
                {/* Left Panel: Groups List */}
                <div className="w-[320px] bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
                    <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                        <h3 className="font-bold text-sm tracking-wide uppercase text-indigo-400">Group Channels</h3>
                        <button
                            onClick={() => setShowCreateGroupModal(true)}
                            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                            Create
                        </button>
                    </div>

                    {/* Groups Scrollpane */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                        {groups.length > 0 ? (
                            groups.map((group) => {
                                const isSelected = activeGroup?.id === group.id;

                                return (
                                    <div
                                        key={group.id}
                                        onClick={() => {
                                            setActiveGroup(group);
                                            setShowSettingsDrawer(false);
                                            setShowFilesDrawer(false);
                                        }}
                                        className={`p-4 cursor-pointer hover:bg-slate-800/50 transition-all ${isSelected ? "bg-indigo-900/35 border-l-4 border-indigo-500" : ""}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-750 flex items-center justify-center font-bold text-indigo-300">
                                                #
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-semibold text-sm text-slate-200 truncate">
                                                    {group.name}
                                                </h5>
                                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                                    {group.description || "No description"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center p-8 text-sm text-slate-500">No group chats joined yet</div>
                        )}
                    </div>
                </div>

                {/* Center Panel: Active Group Chat Window */}
                <div className="flex-1 flex flex-col bg-slate-950 h-full min-w-0 relative">
                    {activeGroup ? (
                        <>
                            {/* Group Header */}
                            <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0 shadow-md">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-indigo-400">
                                        #
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-slate-200 truncate">
                                            {activeGroup.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-400">
                                                {groupMembers.length} Members
                                            </span>
                                            {Object.keys(typingUsers).length > 0 && (
                                                <span className="text-xs text-green-400 animate-pulse ml-2 font-medium">
                                                    • {Object.values(typingUsers).map(u => u.name).join(", ")} {Object.keys(typingUsers).length > 1 ? "are" : "is"} typing...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Header Options */}
                                <div className="flex items-center gap-2">
                                    {/* Search message form */}
                                    <form onSubmit={handleSearchMessages} className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            placeholder="Search group..."
                                            value={searchMessageQuery}
                                            onChange={(e) => setSearchMessageQuery(e.target.value)}
                                            className="bg-slate-950 text-slate-200 placeholder-slate-650 text-xs px-2.5 py-1.5 rounded border border-slate-850 focus:outline-none focus:border-indigo-650 w-28 sm:w-40 transition-all"
                                        />
                                        <button type="submit" className="p-1.5 rounded bg-indigo-900/60 hover:bg-indigo-850 text-indigo-400 border border-indigo-800/40 transition-colors">
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                        </button>
                                    </form>
                                    {searchActive && (
                                        <button onClick={clearMessageSearch} className="text-[10px] text-red-400 bg-red-950/40 rounded px-1.5 py-1 border border-red-900/20">
                                            Clear
                                        </button>
                                    )}

                                    {/* Files Drawer Toggle */}
                                    <button
                                        onClick={() => {
                                            setShowFilesDrawer(!showFilesDrawer);
                                            setShowSettingsDrawer(false);
                                        }}
                                        className={`p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer ${showFilesDrawer ? "bg-slate-800 text-indigo-400" : ""}`}
                                        title="Shared Files"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                                    </button>

                                    {/* Members & Admin Settings Drawer Toggle */}
                                    <button
                                        onClick={() => {
                                            setShowSettingsDrawer(!showSettingsDrawer);
                                            setShowFilesDrawer(false);
                                        }}
                                        className={`p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer ${showSettingsDrawer ? "bg-slate-800 text-indigo-400" : ""}`}
                                        title="Group Settings & Members"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Pinned Message Banner */}
                            {pinnedMessage && (
                                <div className="bg-indigo-950/45 border-b border-indigo-900/40 p-3 px-4 flex items-center justify-between shrink-0 backdrop-blur-sm">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <svg className="h-4.5 w-4.5 text-indigo-400 shrink-0 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V5zM4 11h16m-4 4h-8m1 4h6"></path></svg>
                                        <div className="min-w-0 text-xs">
                                            <span className="text-[10px] uppercase text-indigo-400 font-bold block leading-none mb-0.5">Pinned by Admin</span>
                                            <p className="text-slate-200 font-medium truncate">{pinnedMessage.content}</p>
                                        </div>
                                    </div>
                                    {isCurrentUserAdmin() && (
                                        <button
                                            onClick={() => handleTogglePin(pinnedMessage.id)}
                                            className="text-[10px] text-indigo-300 hover:text-red-400 font-semibold px-2 py-1 hover:bg-slate-900 rounded border border-indigo-900/30 transition-all cursor-pointer"
                                        >
                                            Unpin
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Message Feed Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {searchActive && (
                                    <div className="text-center bg-indigo-950/30 border border-indigo-900/30 text-indigo-300 rounded-lg p-2 text-xs">
                                        Filtering messages matching "{searchMessageQuery}" ({searchResults.length} found)
                                    </div>
                                )}

                                {displayedMessages.length > 0 ? (
                                    Object.entries(groupMessagesByDate(displayedMessages)).map(([date, dateMessages]) => (
                                        <div key={date} className="space-y-4">
                                            <div className="flex justify-center my-1">
                                                <span className="text-xs font-semibold text-slate-500 bg-slate-900/70 px-3 py-0.5 rounded-full border border-slate-800/30 shadow-sm">
                                                    {date}
                                                </span>
                                            </div>

                                            {dateMessages.map((msg) => {
                                                const isMine = msg.senderId === currentUserId;
                                                const hasMedia = msg.mediaUrl != null;
                                                const isImage = hasMedia && msg.mediaType?.startsWith("image/");
                                                const myReaction = msg.reactions?.find((r) => r.userId === currentUserId);

                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex flex-col group ${isMine ? "items-end" : "items-start"}`}
                                                    >
                                                        {/* Sender Name */}
                                                        {!isMine && (
                                                            <span className="text-[11px] text-slate-500 ml-1.5 mb-1">
                                                                {msg.senderName}
                                                            </span>
                                                        )}

                                                        <div className="flex items-center gap-2 max-w-[85%] sm:max-w-[70%] relative">
                                                            {/* Reaction and Pin options on hover */}
                                                            <div className={`absolute -top-9 z-10 hidden group-hover:flex bg-slate-900 border border-slate-850 rounded-full shadow-lg px-2.5 py-1 gap-1.5 items-center ${isMine ? "right-2" : "left-2"}`}>
                                                                {/* Emojis list */}
                                                                {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => handleReact(msg.id, emoji)}
                                                                        className={`hover:scale-130 active:scale-95 transition-all text-sm p-0.5 rounded-full ${myReaction?.emoji === emoji ? "bg-indigo-900/50" : ""}`}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}

                                                                {/* Pin Action (Admin only) */}
                                                                {isCurrentUserAdmin() && (
                                                                    <button
                                                                        onClick={() => handleTogglePin(msg.id)}
                                                                        className={`text-[10px] px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer border ${msg.isPinned ? "text-indigo-400 border-indigo-700 bg-indigo-950/20" : "text-slate-400 border-slate-700"}`}
                                                                        title={msg.isPinned ? "Unpin message" : "Pin message"}
                                                                    >
                                                                        Pin
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Message Bubble */}
                                                            <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all ${
                                                                isMine
                                                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                                                    : "bg-slate-850 text-slate-200 rounded-tl-none border border-slate-800/40"
                                                            } ${msg.isPinned ? "border-l-4 border-l-indigo-400" : ""}`}>
                                                                
                                                                {/* Pinned status badge inside message */}
                                                                {msg.isPinned && (
                                                                    <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-300 mb-1 uppercase tracking-wider">
                                                                        <svg className="h-3 w-3 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V5zM4 11h16m-4 4h-8m1 4h6"></path></svg>
                                                                        Pinned
                                                                    </span>
                                                                )}

                                                                {/* Media Preview */}
                                                                {hasMedia && (
                                                                    <div className="mb-2">
                                                                        {isImage ? (
                                                                            <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
                                                                                <img
                                                                                    src={msg.mediaUrl}
                                                                                    alt="Attachment"
                                                                                    className="max-h-60 rounded-lg object-cover hover:opacity-90 transition-opacity border border-slate-750/30"
                                                                                />
                                                                            </a>
                                                                        ) : (
                                                                            <a
                                                                                href={msg.mediaUrl}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-200 border border-slate-800 transition-colors"
                                                                            >
                                                                                <svg className="h-6 w-6 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                                                <div className="text-left min-w-0">
                                                                                    <p className="text-xs font-medium truncate">{msg.content}</p>
                                                                                    <span className="text-[10px] text-slate-500 uppercase">{msg.mediaType?.split("/")[1] || "file"}</span>
                                                                                </div>
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <p className="break-words leading-relaxed">{msg.content}</p>

                                                                {/* Time stamp */}
                                                                <div className="flex items-center justify-end gap-1 text-[10px] text-indigo-200/70 mt-1.5">
                                                                    <span>
                                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Reactions */}
                                                        {msg.reactions && msg.reactions.length > 0 && (
                                                            <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                                                                {msg.reactions.map((react) => (
                                                                    <span
                                                                        key={react.id}
                                                                        title={`Reacted by ${react.userName}`}
                                                                        onClick={() => handleReact(msg.id, react.emoji)}
                                                                        className={`text-xs px-2 py-0.5 rounded-full bg-slate-900 border cursor-pointer hover:bg-slate-850 select-none transition-colors ${
                                                                            react.userId === currentUserId
                                                                                ? "border-indigo-600/50 bg-indigo-950/20 text-indigo-300"
                                                                                : "border-slate-800 text-slate-400"
                                                                        }`}
                                                                    >
                                                                        {react.emoji}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-500 py-12 text-sm">
                                        No messages in group yet. Start the conversation!
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input Bar */}
                            <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0">
                                {uploadingFile && (
                                    <div className="flex items-center gap-2 text-xs text-indigo-400 px-3 py-1.5 mb-2 bg-indigo-950/30 border border-indigo-900/30 rounded-lg animate-pulse">
                                        <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Uploading attachment...
                                    </div>
                                )}

                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={triggerFileSelect}
                                        disabled={uploadingFile}
                                        className="p-2.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                                        title="Share Image or File"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                    </button>

                                    <input
                                        type="text"
                                        placeholder="Message group..."
                                        value={textInput}
                                        onChange={handleInputChange}
                                        className="flex-1 bg-slate-950 text-slate-100 placeholder-slate-500 text-sm px-4 py-2.5 rounded-full border border-slate-800 focus:outline-none focus:border-indigo-650 transition-colors"
                                    />

                                    <button
                                        type="submit"
                                        disabled={!textInput.trim()}
                                        className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors cursor-pointer shrink-0"
                                    >
                                        <svg className="h-5 w-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950">
                            <div className="h-20 w-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-xl mb-4">
                                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-200">Start a Group Chat</h3>
                            <p className="text-slate-400 max-w-sm mt-1 text-sm">
                                Create a new channel or choose an existing group from the list on the left to start collaborating with your team members.
                            </p>
                        </div>
                    )}

                    {/* Drawer 1: Group Settings & Member Management */}
                    {showSettingsDrawer && activeGroup && (
                        <div className="w-[320px] bg-slate-900 border-l border-slate-800 flex flex-col h-full absolute right-0 top-0 z-20 shadow-2xl animate-slide-in">
                            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                                <h4 className="font-bold text-sm text-indigo-400">Members & Settings</h4>
                                <button onClick={() => setShowSettingsDrawer(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                            {/* Invite Section (Admins only) */}
                            {isCurrentUserAdmin() && (
                                <div className="p-4 border-b border-slate-800 bg-slate-900/60">
                                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">Invite Members</h5>
                                    <form onSubmit={handleAddMember} className="flex gap-2">
                                        <select
                                            value={inviteUserId}
                                            onChange={(e) => setInviteUserId(e.target.value)}
                                            className="flex-1 bg-slate-950 text-slate-350 text-xs px-2 py-1.5 rounded border border-slate-800 focus:outline-none"
                                        >
                                            <option value="">Select coworker...</option>
                                            {nonMembers.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.FirstName} {user.LastName} ({user.Department})
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={!inviteUserId}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Members scroll list */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Group Members ({groupMembers.length})</h5>
                                <div className="space-y-3">
                                    {groupMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/20">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-semibold text-slate-200 truncate">{member.userName}</span>
                                                    {member.isAdmin && (
                                                        <span className="bg-indigo-900/50 text-indigo-400 border border-indigo-800/40 text-[9px] font-bold px-1 py-0.25 rounded-md">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-500 truncate block mt-0.5">{member.userEmail}</span>
                                            </div>

                                            {/* Action buttons (Visible only to other admins) */}
                                            {isCurrentUserAdmin() && member.userId !== currentUserId && (
                                                <div className="flex items-center gap-1">
                                                    {!member.isAdmin && (
                                                        <button
                                                            onClick={() => handlePromoteMember(member.userId)}
                                                            className="text-[9px] text-indigo-400 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/30 px-1.5 py-0.5 rounded cursor-pointer"
                                                            title="Promote to admin"
                                                        >
                                                            Promote
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveMember(member.userId)}
                                                        className="text-[9px] text-red-400 bg-red-950/40 hover:bg-red-900/40 border border-red-900/25 px-1.5 py-0.5 rounded cursor-pointer"
                                                        title="Remove from group"
                                                    >
                                                        Kick
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Leave Group Section */}
                            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-center">
                                <button
                                    onClick={handleLeaveGroup}
                                    className="w-full py-2 bg-red-650 hover:bg-red-500 rounded text-xs font-bold text-white transition-colors cursor-pointer shadow-md"
                                >
                                    Leave Channel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Drawer 2: Shared Files Viewer */}
                    {showFilesDrawer && activeGroup && (
                        <div className="w-[320px] bg-slate-900 border-l border-slate-800 flex flex-col h-full absolute right-0 top-0 z-20 shadow-2xl animate-slide-in">
                            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                                <h4 className="font-bold text-sm text-indigo-400">Shared Files & Media</h4>
                                <button onClick={() => setShowFilesDrawer(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                            {/* Files scroll area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {sharedFiles.length > 0 ? (
                                    sharedFiles.map((fileMsg) => {
                                        const isImage = fileMsg.mediaType?.startsWith("image/");
                                        return (
                                            <div key={fileMsg.id} className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/30">
                                                {isImage ? (
                                                    <div className="space-y-1.5">
                                                        <a href={fileMsg.mediaUrl} target="_blank" rel="noreferrer" className="block">
                                                            <img
                                                                src={fileMsg.mediaUrl}
                                                                alt="Shared"
                                                                className="max-h-36 w-full object-cover rounded-md border border-slate-800"
                                                            />
                                                        </a>
                                                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                            <span>By {fileMsg.senderName}</span>
                                                            <span>{getFormattedDate(fileMsg.timestamp)}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1.5">
                                                        <a
                                                            href={fileMsg.mediaUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 min-w-0"
                                                        >
                                                            <svg className="h-5 w-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                                            <span className="text-xs font-semibold truncate flex-1 text-left">{fileMsg.content.replace("Shared file: ", "")}</span>
                                                        </a>
                                                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                            <span>By {fileMsg.senderName}</span>
                                                            <span>{getFormattedDate(fileMsg.timestamp)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center p-8 text-xs text-slate-500">No shared files found in this group</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Create Group */}
            {showCreateGroupModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-96 shadow-2xl">
                        <h3 className="text-lg font-bold text-indigo-400 mb-4">Create New Group Channel</h3>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Group Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter group name..."
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="w-full bg-slate-950 text-slate-200 placeholder-slate-600 text-sm px-3.5 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-650"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
                                <textarea
                                    placeholder="Enter description..."
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                    className="w-full bg-slate-950 text-slate-200 placeholder-slate-600 text-sm px-3.5 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-650 resize-none h-20"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateGroupModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
                                >
                                    Create Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroupChat;
