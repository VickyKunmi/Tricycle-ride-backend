import express from "express";
import {
  assignRide,
  cancelAssignRide,
  cancelRide,
  completeRide,
  createRide,
  getAllRides,
  getDriverRides,
  getPaymentTrends,
  getRecentRides,
  getRideById,
  getRideStats,
  getUnassignedRides,
  startTrip,
  trackRide,
} from "../controllers/rideController.js";
import authMiddleware from "../middleware/auth.js";

const rideRouter = express.Router();

rideRouter.get("/recent/:customerId", getRecentRides);
rideRouter.get("/unassigned", getUnassignedRides);
rideRouter.get("/ridestatus", getRideStats);
rideRouter.get("/payment-trends", getPaymentTrends);
rideRouter.get("/driver/:driverId", getDriverRides);
rideRouter.get("/all", authMiddleware, getAllRides);
rideRouter.get("/:rideId", getRideById);
rideRouter.get("/track/:rideId", trackRide);
rideRouter.post("/create", createRide);
rideRouter.patch("/:rideId/assign", authMiddleware, assignRide);
rideRouter.patch("/:rideId/start", authMiddleware, startTrip);
rideRouter.patch("/:rideId/cancelAssign", authMiddleware, cancelAssignRide);
rideRouter.patch("/:rideId/complete", authMiddleware, completeRide);
rideRouter.delete("/:rideId/cancel", authMiddleware, cancelRide);


export default rideRouter;
