import mongoose from "mongoose";

const riderSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    phone: String,
    address: String,
    username: String,
    password: String,
    tricycleNumberPlate: String,
    tricycleModel: String,
    tricycleColor: String,
    image: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
  });
  

const riderModel = mongoose.model("Rider", riderSchema);
export default riderModel;
