import express from "express";
import { initializePayment, verifyPayment } from "../controllers/paymentController.js";


const paymentRoute = express.Router();


paymentRoute.post("/initialize", initializePayment);
paymentRoute.get("/verify/:reference", verifyPayment);

export default paymentRoute;