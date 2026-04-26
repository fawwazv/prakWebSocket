const { io } = require("socket.io-client");
const socket = io("http://localhost:4000", { transports: ["websocket"] });

socket.on("connect", () => {
    console.log("Connected to backend!");
});

socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
});

socket.on("tick", (data) => {
    console.log("Tick:", data.symbol, data.price);
});

setTimeout(() => {
    socket.disconnect();
    process.exit(0);
}, 5000);
