
import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  fullName: { type: String },
  email: { type: String },
  phone: { type: String, required: true, unique: true },
  password: { type: String },
  otp: { type: String }, 
  otpExpiresAt: { type: Date }, 
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const customerModel = mongoose.model("Customer", customerSchema);
export default customerModel;
