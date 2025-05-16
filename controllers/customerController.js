import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import customerModel from "../models/customerModel.js";

const generateOTP = () => {
  // Generate a 6-digit random OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP_SMS = async (phone, otp) => {
  const API_KEY = process.env.MNOTIFY_API_KEY;
  const url = "https://api.mnotify.com/api/sms/quick";
  const message = `Your OTP code is: ${otp}. It will expire in 5 minutes.`;

  try {
    const response = await axios.post(url, null, {
      params: {
        key: API_KEY,
        recipient: [phone],
        message: message,
        sender: "tricycle",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error sending SMS:", error.response?.data || error.message);
    throw error;
  }
};

export const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Basic validations (more can be added)
    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Check if customer already exists
    const existingCustomer = await customerModel.findOne({ phone});
    if (existingCustomer) {
      return res
        .status(400)
        .json({ message: "Phone number already registered." });
    }

    // Hash the customer's password (if using password based login)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP and expiry time (e.g., 5 minutes from now)
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Create new customer with status pending verification
    const newCustomer = new customerModel({
      fullName,
      email,
      phone,
      password: hashedPassword,
      otp,
      otpExpiresAt,
      isVerified: false,
    });
    await newCustomer.save();

    // Send OTP using mNotify
    await sendOTP_SMS(phone, otp);

    res
      .status(200)
      .json({
        message: "Account created. Please verify OTP sent to your phone.",
      });
  } catch (error) {
    console.error("Error in registerCustomer:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Find the customer by phone
    const customer = await customerModel.findOne({ phone });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // Check if OTP is correct and not expired
    if (customer.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (new Date() > customer.otpExpiresAt) {
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new one." });
    }

    // OTP is valid: update customer verification status and remove OTP fields
    customer.isVerified = true;
    customer.otp = undefined;
    customer.otpExpiresAt = undefined;
    await customer.save();

    res.status(200).json({ message: "Phone verified successfully." });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const loginCustomer = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res
      .status(400)
      .json({ message: "Phone and password are required." });
  }

  try {
    const customer = await customerModel.findOne({ phone });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    if (!customer.isVerified) {
      return res
        .status(403)
        .json({ message: "Account not verified. Please verify your phone." });
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: customer._id, phone: customer.phone },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("Error in loginCustomer:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await customerModel
      .find()
      .select("-password -otp -otpExpiresAt"); // exclude sensitive fields
    res.status(200).json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



export const savePushToken = async (req, res) => {
  const { customerId, expoPushToken } = req.body;

  if (!customerId || !expoPushToken) {
    return res.status(400).json({ message: "customerId and expoPushToken are required." });
  }

  try {
    const customer = await customerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    customer.expoPushToken = expoPushToken;
    await customer.save();

    res.status(200).json({ message: "Push token saved successfully." });
  } catch (error) {
    console.error("Error saving push token:", error);
    res.status(500).json({ message: "Server error", error });
  }
};





export const getTotalCustomersCount = async (req, res) => {
  try {
    const totalCustomers = await customerModel.countDocuments(); 
    return res.status(200).json({ totalCustomers });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch rider count.", error });
  }
};



export const getCustomerGrowth = async (req, res) => {
  try {
   
    const customerGrowth = await customerModel.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" }, 
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, 
    ]);

    
    const formattedData = customerGrowth.map((entry) => ({
      name: new Date(2020, entry._id - 1).toLocaleString("en-US", {
        month: "short",
      }), 
      value: entry.count,
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error fetching customer growth:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
