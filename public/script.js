const socket = io();
let currentRoom = "general";
let username = prompt("Enter your name:") || "Anonymous";

// New alert sound for messages
const messageSound = new Audio("https://cdn.freesound.org/previews/524/524331_9212650-lq.mp3");

// ✅ Join a chat room
function joinRoom(room) {
    if (currentRoom !== room) {
        socket.emit("join room", { username, room });
        currentRoom = room;
        document.getElementById("messages").innerHTML = ""; // Clear chat history
    }
}

// ✅ Send a message
function sendMessage() {
    const msg = document.getElementById("messageInput").value;
    if (msg.trim() === "") return;
    socket.emit("chat message", { username, room: currentRoom, message: msg });
    document.getElementById("messageInput").value = "";
}

// ✅ Enter key to send messages
function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// ✅ Listen for chat messages
socket.on("chat message", ({ username: sender, message }) => {
    const li = document.createElement("li");
    li.textContent = `${sender}: ${message}`;
    
    li.classList.add("message", sender === username ? "sent" : "received");

    document.getElementById("messages").appendChild(li);

    // Play notification sound only if the message is from someone else
    if (sender !== username) {
        messageSound.play();
    }

    // Auto-scroll to latest message
    const chatBox = document.getElementById("chat");
    chatBox.scrollTop = chatBox.scrollHeight;
});

// ✅ Update online users list
socket.on("update users", (users) => {
    console.log("Updated online users:", users);
    const userList = document.getElementById("userList");
    userList.innerHTML = "";
    users.forEach(user => {
        const li = document.createElement("li");
        li.textContent = user;
        userList.appendChild(li);
    });
});

// ✅ Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}

// ✅ Insert Emoji into Message
function insertEmoji() {
    document.getElementById("messageInput").value += "😊";
}
