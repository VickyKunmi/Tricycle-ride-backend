import express from "express";
import axios from "axios";
import Ride from "../models/rideModel.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

export const initializePayment = async (req, res) => {
  const { email, amount, rideDetails } = req.body;
  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount,
        callback_url: process.env.CALLBACK_URL,
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    const { authorization_url, reference } = response.data.data;

    const ride = await Ride.create({
      ...rideDetails,
      paymentReference: reference,
      paymentStatus: "pending",
    });

    return res.json({ authorization_url, reference, rideId: ride._id });
  } catch (err) {
    console.error(err.response?.data || err);
    return res.status(500).json({ error: "Could not initialize transaction" });
  }
};

export const verifyPayment = async (req, res) => {
  const { reference } = req.params;
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );

    const { status, amount, currency } = response.data.data;
    if (status === "success") {
      // Update ride in DB
      const ride = await Ride.findOneAndUpdate(
        { paymentReference: reference },
        { paymentStatus: "paid" },
        { new: true }
      );
      return res.json({ success: true, ride });
    } else {
      return res.status(400).json({ error: "Payment not successful" });
    }
  } catch (err) {
    console.error(err.response?.data || err);
    return res.status(500).json({ error: "Verification failed" });
  }
};

export default router;
