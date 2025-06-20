import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  autoConnect: true, // Auto connect once globally
  reconnectionAttempts: 5,
  timeout: 10000,
});

export { socket };
