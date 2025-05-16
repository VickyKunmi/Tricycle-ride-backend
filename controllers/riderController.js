import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import riderModel from "../models/riderModel.js";
import { sendSms } from "../utils/sendSms.js";

import cloudinary from "../cloudinaryConfig.js";

export const registerRider = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      username,
      password,
      tricycleNumberPlate,
      tricycleModel,
      tricycleColor,
    } = req.body;

    if (!req.file) {
      console.error({ error: "No file attached to the request." });
      return res.status(400).json({ error: "No file attached to the request" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
      folder: "tricycle",
    });

    if (!result || result.error) {
      console.error("Cloudinary Upload Error:", result.error);
      return res
        .status(500)
        .json({ error: "Failed to upload image to Cloudinary" });
    }
    const images = result.secure_url;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newRider = new riderModel({
      fullName,
      email,
      phone,
      address,
      username,
      password: hashedPassword,
      tricycleNumberPlate,
      tricycleModel,
      tricycleColor,
      image: images,
    });
    await newRider.save();
    res.status(200).json({
      message:
        "Rider Account created successfully. Please wait for admin verification.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create rider account" });
  }
};

export const loginRider = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide both username and password." });
  }

  try {
    const rider = await riderModel.findOne({ username });
    if (!rider) {
      return res.status(404).json({ message: "Rider not found." });
    }

    if (rider.status !== "approved") {
      return res.status(403).json({
        message: "Rider not approved. Please wait for admin verification.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, rider.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: rider._id, username: rider.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: rider._id,
        fullName: rider.fullName,
        email: rider.email,
        phone: rider.phone,
        username: rider.username,
        image: rider.image,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
};

export const updateRiderStatus = async (req, res) => {
  const { riderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["pending", "approved", "rejected"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  try {
    const updatedRider = await riderModel.findByIdAndUpdate(
      riderId,
      { status },
      { new: true }
    );

    if (!updatedRider) {
      return res.status(404).json({ message: "Rider not found." });
    }

    try {
      if (status === "approved" || status === "rejected") {
        const message =
          status === "approved"
            ? `Hello ${updatedRider.fullName}, your rider account has been approved. You can now start accepting rides.`
            : `Hello ${updatedRider.fullName}, your rider registration was rejected. Contact admin or try registering again with valid details.`;

        console.log(`Sending ${status} SMS...`);
        await sendSms({ to: updatedRider.phone, message });
      }
    } catch (smsError) {
      console.error(
        "SMS sending failed:",
        smsError.response?.data || smsError.message
      );
    }

    return res.status(200).json({
      message: `Rider status updated to '${status}'.`,
      rider: updatedRider,
    });
  } catch (error) {
    console.error("Update rider error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
};

export const getAllRiders = async (req, res) => {
  try {
    const riders = await riderModel.find().sort({ createdAt: -1 });
    return res.status(200).json(riders);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch riders.", error });
  }
};

export const getApprovedRiders = async (req, res) => {
  try {
    const approvedRiders = await riderModel
      .find({ status: "approved" })
      .sort({ createdAt: -1 });
    return res.status(200).json(approvedRiders);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch approved riders.", error });
  }
};

export const getTotalRidersCount = async (req, res) => {
  try {
    const totalRiders = await riderModel.countDocuments();
    return res.status(200).json({ totalRiders });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch rider count.", error });
  }
};

export const getTotalPendingRiders = async (req, res) => {
  try {
    const totalPendingRiders = await riderModel.countDocuments({
      status: "pending",
    });
    return res.status(200).json({ totalPendingRiders });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch pending rider count.", error });
  }
};

export const getTotalApprovedRiders = async (req, res) => {
  try {
    const totalApprovedRiders = await riderModel.countDocuments({
      status: "approved",
    });
    return res.status(200).json({ totalApprovedRiders });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch approved rider count.", error });
  }
};
