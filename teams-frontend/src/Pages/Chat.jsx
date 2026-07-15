import { useState, useEffect, useRef } from "react";
import Sidebar from "../Components/SideBar";
import Navbar from "../Components/Navbar";
import api from "../api/axios";

function Chat() {
    const [contacts, setContacts] = useState([]);
    const [searchContactQuery, setSearchContactQuery] = useState("");
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    
    // Search messages state
    const [searchMessageQuery, setSearchMessageQuery] = useState("");
    const [searchActive, setSearchActive] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const [textInput, setTextInput] = useState("");
    const [unreadCounts, setUnreadCounts] = useState({});
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    
    // Typing states
    const [peerTyping, setPeerTyping] = useState({});
    const typingTimeoutRef = useRef(null);
    const isTypingSentRef = useRef(false);

    // Media states
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef(null);

    // WebSocket state
    const [ws, setWs] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);

    const messagesEndRef = useRef(null);

    // 1. Fetch Profile and Contacts
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch logged-in user profile
                const profileRes = await api.get("/users/me");
                setCurrentUser(profileRes.data);
                setCurrentUserId(profileRes.data.id);

                // Fetch other users
                const contactsRes = await api.get("/users");
                setContacts(contactsRes.data);

                // Fetch unread counts
                const unreadRes = await api.get("/messages/unread");
                setUnreadCounts(unreadRes.data || {});
            } catch (err) {
                console.error("Error fetching initial chat data:", err);
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
                console.log("WebSocket connected");
                setWsConnected(true);
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === "CONNECTION_ACK") {
                        if (data.onlineUsers) {
                            setOnlineUsers(new Set(data.onlineUsers));
                        }
                    } else if (data.type === "USER_STATUS") {
                        setOnlineUsers((prev) => {
                            const updated = new Set(prev);
                            if (data.status === "ONLINE") {
                                updated.add(data.userId);
                            } else {
                                updated.delete(data.userId);
                            }
                            return updated;
                        });
                    } else if (data.type === "CHAT") {
                        const newMsg = data.message;
                        const isFromActive = activeContact && newMsg.senderId === activeContact.id;
                        const isToActive = activeContact && newMsg.receiverId === activeContact.id;

                        if (isFromActive || isToActive) {
                            setMessages((prev) => {
                                // Prevent duplicates
                                if (prev.some((m) => m.id === newMsg.id)) return prev;
                                return [...prev, newMsg];
                            });

                            // If message is from the active contact, send read receipt automatically
                            if (isFromActive) {
                                socket.send(JSON.stringify({
                                    type: "READ_RECEIPT",
                                    receiverId: activeContact.id
                                }));
                            }
                        } else if (newMsg.senderId !== currentUserId) {
                            // If from someone else, increment unread counts
                            setUnreadCounts((prev) => ({
                                ...prev,
                                [newMsg.senderId]: (prev[newMsg.senderId] || 0) + 1
                            }));
                        }
                    } else if (data.type === "TYPING") {
                        setPeerTyping((prev) => ({
                            ...prev,
                            [data.senderId]: data.isTyping
                        }));
                    } else if (data.type === "READ_RECEIPT") {
                        // The recipient has read our messages. Turn double ticks blue.
                        if (activeContact && data.readerId === activeContact.id) {
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.receiverId === activeContact.id ? { ...msg, status: "READ" } : msg
                                )
                            );
                        }
                    } else if (data.type === "REACTION") {
                        const updatedMsg = data.message;
                        setMessages((prev) =>
                            prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
                        );
                    }
                } catch (e) {
                    console.error("Error parsing WebSocket message:", e);
                }
            };

            socket.onclose = () => {
                console.log("WebSocket disconnected. Attempting reconnect...");
                setWsConnected(false);
                reconnectInterval = setTimeout(connect, 3000);
            };

            socket.onerror = (err) => {
                console.error("WebSocket error:", err);
                socket.close();
            };

            setWs(socket);
        };

        connect();

        return () => {
            if (socket) socket.close();
            if (reconnectInterval) clearTimeout(reconnectInterval);
        };
    }, [activeContact, currentUserId]);

    // 3. Fetch Conversation History when Active Contact changes
    useEffect(() => {
        if (!activeContact) return;

        const fetchHistory = async () => {
            try {
                const res = await api.get(`/messages/history/${activeContact.id}`);
                setMessages(res.data);

                // Clear unread counts for this contact
                setUnreadCounts((prev) => ({
                    ...prev,
                    [activeContact.id]: 0
                }));

                // Notify backend via WebSocket that messages have been read
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: "READ_RECEIPT",
                        receiverId: activeContact.id
                    }));
                }

                setSearchActive(false);
                setSearchMessageQuery("");
            } catch (err) {
                console.error("Error fetching chat history:", err);
            }
        };

        fetchHistory();
    }, [activeContact]);

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 4. Send Typing Indicator
    const handleInputChange = (e) => {
        setTextInput(e.target.value);

        if (!activeContact || !ws || ws.readyState !== WebSocket.OPEN) return;

        if (!isTypingSentRef.current) {
            isTypingSentRef.current = true;
            ws.send(JSON.stringify({
                type: "TYPING",
                receiverId: activeContact.id,
                isTyping: true
            }));
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            ws.send(JSON.stringify({
                type: "TYPING",
                receiverId: activeContact.id,
                isTyping: false
            }));
            isTypingSentRef.current = false;
        }, 2000);
    };

    // 5. Send Chat Message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!textInput.trim() || !activeContact || !ws || ws.readyState !== WebSocket.OPEN) return;

        // Clear typing indicator
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        ws.send(JSON.stringify({
            type: "TYPING",
            receiverId: activeContact.id,
            isTyping: false
        }));
        isTypingSentRef.current = false;

        // Send chat event
        ws.send(JSON.stringify({
            type: "CHAT",
            receiverId: activeContact.id,
            content: textInput
        }));

        setTextInput("");
    };

    // 6. Media Attachment Upload
    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeContact || !ws || ws.readyState !== WebSocket.OPEN) return;

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
                type: "CHAT",
                receiverId: activeContact.id,
                content: `Sent a file: ${fileName}`,
                mediaUrl: url,
                mediaType: mediaType
            }));
        } catch (err) {
            console.error("Error uploading file:", err);
            alert("Failed to upload media. Please try again.");
        } finally {
            setUploadingFile(false);
            e.target.value = ""; // Reset file input
        }
    };

    // 7. Toggle Emojis Reactions
    const handleReact = (messageId, emoji) => {
        if (!activeContact || !ws || ws.readyState !== WebSocket.OPEN) return;

        // Find if user already reacted with this exact emoji
        const msg = messages.find((m) => m.id === messageId);
        const existingReaction = msg?.reactions?.find((r) => r.userId === currentUserId);
        
        const finalEmoji = existingReaction && existingReaction.emoji === emoji ? "" : emoji;

        ws.send(JSON.stringify({
            type: "REACTION",
            messageId: messageId,
            emoji: finalEmoji,
            receiverId: activeContact.id
        }));
    };

    // 8. Search Message History
    const handleSearchMessages = async (e) => {
        e.preventDefault();
        if (!searchMessageQuery.trim() || !activeContact) return;

        try {
            const res = await api.get(`/messages/search`, {
                params: {
                    contactId: activeContact.id,
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

    // Helper to format date groups
    const getFormattedDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    };

    // Group messages by date
    const groupMessagesByDate = (msgList) => {
        const groups = {};
        msgList.forEach((msg) => {
            const dateKey = getFormattedDate(msg.timestamp);
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(msg);
        });
        return groups;
    };

    const filteredContacts = contacts.filter((c) =>
        `${c.FirstName} ${c.LastName}`.toLowerCase().includes(searchContactQuery.toLowerCase())
    );

    const displayedMessages = searchActive ? searchResults : messages;

    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Navbar (fixed at top in Dashboard.jsx, let's keep it here or custom) */}
            <Navbar />

            {/* Main Chat Layout Container */}
            <div className="flex flex-1 ml-[250px] mt-[80px] h-[calc(100vh-80px)] overflow-hidden">
                {/* Left Panel: Contacts List */}
                <div className="w-[320px] bg-slate-900 border-r border-slate-800 flex flex-col h-full">
                    {/* User profile brief */}
                    <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                                {currentUser?.FirstName ? currentUser.FirstName[0] : "U"}
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm leading-tight">
                                    {currentUser ? `${currentUser.FirstName} ${currentUser.LastName}` : "Loading..."}
                                </h4>
                                <span className="text-xs text-slate-400 block">{currentUser?.JobTitle || "Employee"}</span>
                            </div>
                        </div>
                        <span className={`h-2.5 w-2.5 rounded-full ${wsConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} title={wsConnected ? "Connected" : "Disconnected"}></span>
                    </div>

                    {/* Contacts Search Bar */}
                    <div className="p-3 border-b border-slate-800 bg-slate-900">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search people..."
                                value={searchContactQuery}
                                onChange={(e) => setSearchContactQuery(e.target.value)}
                                className="w-full bg-slate-950 text-slate-200 placeholder-slate-500 text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>

                    {/* Contacts scroll area */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                        {filteredContacts.length > 0 ? (
                            filteredContacts.map((contact) => {
                                const isOnline = onlineUsers.has(contact.id);
                                const isSelected = activeContact?.id === contact.id;
                                const unread = unreadCounts[contact.id] || 0;
                                const isTyping = peerTyping[contact.id];

                                return (
                                    <div
                                        key={contact.id}
                                        onClick={() => setActiveContact(contact)}
                                        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-800/60 transition-all ${isSelected ? "bg-indigo-900/40 border-l-4 border-indigo-500" : ""}`}
                                    >
                                        {/* Avatar with presence status dot */}
                                        <div className="relative">
                                            <div className="h-11 w-11 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center font-semibold text-slate-200">
                                                {contact.FirstName[0]}{contact.LastName[0]}
                                            </div>
                                            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${isOnline ? "bg-green-500" : "bg-slate-500"}`}></span>
                                        </div>

                                        {/* Member detail */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h5 className="font-medium text-sm text-slate-200 truncate">
                                                    {contact.FirstName} {contact.LastName}
                                                </h5>
                                                {unread > 0 && (
                                                    <span className="bg-indigo-600 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full">
                                                        {unread}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-slate-400 mt-0.5">
                                                <span className="truncate">{contact.Department} • {contact.JobTitle}</span>
                                            </div>
                                            {isTyping && (
                                                <span className="text-[11px] text-green-400 animate-pulse block mt-0.5">typing...</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center p-6 text-sm text-slate-500">No contacts found</div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Conversation Screen */}
                <div className="flex-1 flex flex-col bg-slate-950 h-full relative">
                    {activeContact ? (
                        <>
                            {/* Chat Window Header */}
                            <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0 shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-200">
                                        {activeContact.FirstName[0]}{activeContact.LastName[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm">
                                            {activeContact.FirstName} {activeContact.LastName}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`h-2 w-2 rounded-full ${onlineUsers.has(activeContact.id) ? "bg-green-500" : "bg-slate-500"}`}></span>
                                            <span className="text-xs text-slate-400">
                                                {onlineUsers.has(activeContact.id) ? "Online" : "Offline"}
                                            </span>
                                            {peerTyping[activeContact.id] && (
                                                <span className="text-xs text-green-400 ml-2 animate-pulse">• typing...</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Message search tools */}
                                <div className="flex items-center gap-2">
                                    <form onSubmit={handleSearchMessages} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Search in chat..."
                                            value={searchMessageQuery}
                                            onChange={(e) => setSearchMessageQuery(e.target.value)}
                                            className="bg-slate-950 text-slate-200 placeholder-slate-600 text-xs px-3 py-1.5 rounded border border-slate-850 focus:outline-none focus:border-indigo-600 w-36 sm:w-48 transition-all"
                                        />
                                        <button type="submit" className="p-1.5 rounded bg-indigo-900/60 hover:bg-indigo-850 text-indigo-400 border border-indigo-800/40 transition-colors">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                        </button>
                                    </form>
                                    {searchActive && (
                                        <button
                                            onClick={clearMessageSearch}
                                            className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 bg-red-950/40 rounded border border-red-900/30 transition-colors"
                                        >
                                            Clear Search
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Chat Scrollpane */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {searchActive && (
                                    <div className="text-center bg-indigo-950/30 border border-indigo-900/30 text-indigo-300 rounded-lg p-2.5 text-xs">
                                        Showing search results matching "{searchMessageQuery}" ({searchResults.length} found)
                                    </div>
                                )}

                                {displayedMessages.length > 0 ? (
                                    Object.entries(groupMessagesByDate(displayedMessages)).map(([date, dateMessages]) => (
                                        <div key={date} className="space-y-4">
                                            {/* Date Separator */}
                                            <div className="flex justify-center my-2">
                                                <span className="text-xs font-semibold text-slate-500 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800/30 shadow-sm">
                                                    {date}
                                                </span>
                                            </div>

                                            {/* Message bubbles */}
                                            {dateMessages.map((msg) => {
                                                const isMine = msg.senderId === currentUserId;
                                                const hasMedia = msg.mediaUrl != null;
                                                const isImage = hasMedia && msg.mediaType?.startsWith("image/");
                                                
                                                // Find my reaction to this message
                                                const myReaction = msg.reactions?.find((r) => r.userId === currentUserId);

                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex flex-col group ${isMine ? "items-end" : "items-start"}`}
                                                    >
                                                        {/* Sender Name (for incoming) */}
                                                        {!isMine && (
                                                            <span className="text-[11px] text-slate-500 ml-1.5 mb-1">
                                                                {msg.senderName}
                                                            </span>
                                                        )}

                                                        <div className="flex items-center gap-2 max-w-[85%] sm:max-w-[70%] relative">
                                                            {/* Reaction Picker Overlay (appears on hover) */}
                                                            <div className={`absolute -top-9 z-10 hidden group-hover:flex bg-slate-900 border border-slate-800 rounded-full shadow-lg px-2 py-1 gap-1.5 ${isMine ? "right-2" : "left-2"}`}>
                                                                {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => handleReact(msg.id, emoji)}
                                                                        className={`hover:scale-130 active:scale-95 transition-all text-sm p-0.5 rounded-full ${myReaction?.emoji === emoji ? "bg-indigo-900/60 border border-indigo-700" : ""}`}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            {/* Message Bubble */}
                                                            <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all ${
                                                                isMine
                                                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                                                    : "bg-slate-850 text-slate-200 rounded-tl-none border border-slate-800/40"
                                                            }`}>
                                                                {/* Media Render */}
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

                                                                {/* Content (Render content unless it was just the file path container, or render it) */}
                                                                <p className="break-words leading-relaxed">{msg.content}</p>

                                                                {/* Timestamp and Read Status */}
                                                                <div className="flex items-center justify-end gap-1 text-[10px] text-indigo-200/70 mt-1.5">
                                                                    <span>
                                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    {isMine && (
                                                                        <span>
                                                                            {msg.status === "READ" ? (
                                                                                <svg className="h-3.5 w-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                                                                            ) : (
                                                                                <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Reactions Render */}
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
                                        No messages. Start typing below to begin chatting!
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Bottom Dock Input */}
                            <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0">
                                {uploadingFile && (
                                    <div className="flex items-center gap-2 text-xs text-indigo-400 px-3 py-1.5 mb-2 bg-indigo-950/30 border border-indigo-900/30 rounded-lg animate-pulse">
                                        <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Uploading attachment...
                                    </div>
                                )}

                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    {/* Media Sharing Button */}
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
                                        className="p-2.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                                        title="Share Image or File"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                    </button>

                                    {/* Chat Text Input Box */}
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={textInput}
                                        onChange={handleInputChange}
                                        className="flex-1 bg-slate-950 text-slate-100 placeholder-slate-500 text-sm px-4 py-2.5 rounded-full border border-slate-800 focus:outline-none focus:border-indigo-650 transition-colors"
                                    />

                                    {/* Send Action Button */}
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
                                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-200">Start a Personal Chat</h3>
                            <p className="text-slate-400 max-w-sm mt-1 text-sm">
                                Choose one of your coworkers from the contact list on the left to start sharing messages, documents, reactions, and more.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Chat;
