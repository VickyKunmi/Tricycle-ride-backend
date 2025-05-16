import express from "express";
import {
  getAllRiders,
  getApprovedRiders,
  getTotalApprovedRiders,
  getTotalPendingRiders,
  getTotalRidersCount,
  loginRider,
  registerRider,
  updateRiderStatus,
} from "../controllers/riderController.js";
import upload from "./uploadMiddleware.js";

const riderRouter = express.Router();


riderRouter.post("/register", upload.single("image"), registerRider);
riderRouter.post("/login", loginRider);
riderRouter.patch("/status/:riderId", updateRiderStatus);
riderRouter.get("/riders", getAllRiders);
riderRouter.get("/total", getTotalRidersCount);
riderRouter.get("/approved", getApprovedRiders);
riderRouter.get("/pending", getTotalPendingRiders);
riderRouter.get("/tapproved", getTotalApprovedRiders);

export default riderRouter;
