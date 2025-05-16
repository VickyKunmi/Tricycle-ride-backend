import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import adminModel from "../models/adminModel.js";

// Admin registration controller
export const registerAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    // Check if any admin already exists
    const adminCount = await adminModel.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({
        message:
          "An admin account already exists. You cannot create another one.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new adminModel({
      username,
      password: hashedPassword,
    });

    await newAdmin.save();

    return res
      .status(201)
      .json({ message: "Admin account created successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
};

export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide both username and password." });
  }

  try {
    const admin = await adminModel.findOne({ username });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error.", error });
  }
};
