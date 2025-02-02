const Message = require("./models/Message"); // Import Mongoose model

let onlineUsers = {}; // Track online users per room

module.exports = (socket, io) => {
    console.log(`User connected: ${socket.id}`);

    let currentRoom = "";
    let username = "";

    // ✅ Handle user joining a room
    socket.on("join room", async ({ username: user, room }) => {
        username = user;
        
        // Leave previous room if applicable
        if (currentRoom) {
            socket.leave(currentRoom);
            removeUserFromRoom(currentRoom, username);
        }

        currentRoom = room;
        socket.join(room);

        // Add user to online users list
        if (!onlineUsers[room]) {
            onlineUsers[room] = [];
        }
        if (!onlineUsers[room].includes(username)) {
            onlineUsers[room].push(username);
        }

        // Send updated online users list
        io.to(room).emit("update users", onlineUsers[room]);

        console.log(`${username} joined room: ${room}`);
        io.to(room).emit("chat message", { username: "System", message: `${username} joined the chat` });

        // ✅ Fetch previous messages from MongoDB
        try {
            const messages = await Message.find({ room }).sort({ timestamp: 1 });
            socket.emit("previous messages", messages);
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    });

    // ✅ Handle new messages
    socket.on("chat message", async ({ username, room, message }) => {
        console.log(`[${room}] ${username}: ${message}`);

        try {
            const newMessage = new Message({ username, room, message });
            await newMessage.save(); // Save message to MongoDB

            io.to(room).emit("chat message", { username, message });
        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    // ✅ Handle typing status
    socket.on("typing", ({ room, username }) => {
        socket.to(room).emit("typing", `${username} is typing...`);
    });

    socket.on("stop typing", (room) => {
        socket.to(room).emit("stop typing");
    });

    // ✅ Handle user disconnect
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        removeUserFromRoom(currentRoom, username);
    });

    // ✅ Function to remove user from a room
    function removeUserFromRoom(room, user) {
        if (room && onlineUsers[room]) {
            onlineUsers[room] = onlineUsers[room].filter(u => u !== user);
            io.to(room).emit("update users", onlineUsers[room]); // Update user list in room
        }
    }
};
