const Message = require("./models/Message"); // Import Mongoose model

module.exports = (socket, io) => {
    console.log(`User connected: ${socket.id}`);

    let currentRoom = "";

    socket.on("join room", async ({ username, room }) => {
        if (currentRoom) {
            socket.leave(currentRoom);
        }
        currentRoom = room;
        socket.join(room);

        console.log(`${username} joined room: ${room}`);
        io.to(room).emit("message", { username: "System", message: `${username} joined the chat` });

        // Fetch previous messages from MongoDB
        const messages = await Message.find({ room }).sort({ timestamp: 1 });
        socket.emit("previous messages", messages);
    });

    socket.on("chat message", async ({ username, room, message }) => {
        console.log(`[${room}] ${username}: ${message}`);

        const newMessage = new Message({ username, room, message });
        await newMessage.save(); // Save message to MongoDB

        io.to(room).emit("chat message", { username, message });
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
};
