import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import adminRouter from "./routes/adminRoutes.js";
import "dotenv/config.js";
import riderRouter from "./routes/riderRoutes.js";
import customerRouter from "./routes/customerRoutes.js";
import rideRouter from "./routes/rideRoutes.js";
import paymentRoute from "./routes/paymentRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

// Setup app
const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/track/:rideId", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "track.html"));
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// DB Connection
connectDB();

// API Routes
app.use("/api/admin", adminRouter);
app.use("/api/rider", riderRouter);
app.use("/api/customer", customerRouter);
app.use("/api/ride", rideRouter);
app.use("/api/payment", paymentRoute);

// Root route
app.get("/", (req, res) => {
  res.send("Trycycle Backend API is running!");
});

// Wrap app in HTTP server for Socket.IO
const server = createServer(app);

// Setup Socket.IO server
const io = new Server(server, {
  cors: { origin: "*" },
});

// Export io to use in controllers if needed
export { io };

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("driver:location", (data) => {
    // Broadcast rider location to all clients except sender
    socket.broadcast.emit("driver:location", data);
  });

  socket.on("ride:arrived", (data) => {
    console.log("Rider arrived event received:", data);

    // Broadcast arrival to all clients (you can scope this by rideId or room)
    socket.broadcast.emit("ride:arrived", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server with Socket.IO running on port ${PORT}`);
});
