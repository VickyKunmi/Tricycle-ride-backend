import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },

  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Rider", default: null },
  status: {
    type: String,
    enum: ["pending", "assigned", "in_transit", "completed"],
    default: "pending",
  },
  completed_at: Date,
  origin_address: String,
  origin_latitude: Number,
  origin_longitude: Number,
  destination_address: String,
  destination_latitude: Number,
  destination_longitude: Number,
  ride_time: Number,
  fare_price: Number,
  payment_status: {
    type: String,
    enum: ["paid", "pending"],
    default: "pending",
  },
  payment_reference: String,
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Ride", rideSchema);
