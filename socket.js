import { Server } from "socket.io";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("register", ({ userId }) => {
      if (userId) {
        socket.join(userId);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error(
      "Socket.io not initialized! Make sure you called initSocket(server)."
    );
  }
  return io;
}
