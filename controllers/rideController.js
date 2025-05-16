import customerModel from "../models/customerModel.js";
import rideModel from "../models/rideModel.js";
import { io } from "../index.js";

export const getRecentRides = async (req, res) => {
  const { customerId } = req.params;

  try {
    const rides = await rideModel
      .find({ customer: customerId })
      .sort({ created_at: -1 })
      .limit(10)
      .populate("driver")
      .exec();

    res.status(200).json(rides);
  } catch (error) {
    console.error("Error fetching recent rides:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const createRide = async (req, res) => {
  const {
    customer,
    origin_address,
    origin_latitude,
    origin_longitude,
    destination_address,
    destination_latitude,
    destination_longitude,
    ride_time,
    fare_price,
  } = req.body;

  try {
    const newRide = new rideModel({
      customer,
      driver: null,
      origin_address,
      origin_latitude,
      origin_longitude,
      destination_address,
      destination_latitude,
      destination_longitude,
      ride_time,
      fare_price,
    });

    await newRide.save();
    io.emit("rides:update");
    res.status(201).json({
      success: true,
      message: "Ride created successfully",
      ride: newRide,
    });
  } catch (error) {
    console.error("Error creating ride:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getUnassignedRides = async (req, res) => {
  try {
    const rides = await rideModel
      .find({ status: "pending" })
      .sort({ created_at: -1 })
      .populate("customer", "fullName phone")
      .exec();
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const assignRide = async (req, res) => {
  const { rideId } = req.params;
  const driverId = req.user.id;

  try {
    const ride = await rideModel.findById(rideId);
    if (!ride || ride.status !== "pending") {
      return res.status(400).json({ message: "Ride not available" });
    }

    ride.driver = driverId;
    ride.status = "assigned";
    await ride.save();

    io.emit("rides:update");

    const customer = await customerModel.findById(ride.customer);
    if (customer?.socketId) {
      io.to(customer.socketId).emit("ride:assigned", {
        message: "Great news! A rider has been assigned to your trip.",
        rideId: ride._id,
      });
    }

    return res.json(ride);
  } catch (err) {
    console.error("assignRide error:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const completeRide = async (req, res) => {
  const { rideId } = req.params;
  console.log("Request to complete ride:", rideId);
  try {
    const ride = await rideModel.findById(rideId);
    if (!ride) {
      console.log("Ride not found");
      return res.status(400).json({ message: "Ride not found" });
    }

    if (!["assigned", "in_transit"].includes(ride.status)) {
      console.log("Ride status not 'assigned':", ride.status);
      return res.status(400).json({ message: "Cannot complete" });
    }

    ride.status = "completed";
    ride.completed_at = new Date();
    ride.payment_status = "paid";
    await ride.save();
    console.log("Ride marked as completed");

    io.emit("rides:update");
    res.json(ride);
  } catch (err) {
    console.error("Complete Ride Error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getDriverRides = async (req, res) => {
  const { driverId } = req.params;
  const status = req.query.status || "assigned";

  try {
    const rides = await rideModel
      .find({ driver: driverId, status })
      .sort({ created_at: -1 })
      .populate("customer", "fullName phone")
      .exec();
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRideById = async (req, res) => {
  const { rideId } = req.params;
  try {
    const ride = await rideModel
      .findById(rideId)
      .populate("customer", "fullName phone")
      .populate("driver", "fullName phone")
      .exec();
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }
    return res.status(200).json(ride);
  } catch (err) {
    console.error("Error fetching ride by id:", err);
    return res.status(500).json({ message: "Server error", error: err });
  }
};

export const cancelRide = async (req, res) => {
  const { rideId } = req.params;

  try {
    const ride = await rideModel.findById(rideId);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.driver) {
      return res
        .status(400)
        .json({ message: "Ride already assigned. Cannot cancel." });
    }

    await rideModel.findByIdAndDelete(rideId);
    io.emit("rides:update");

    return res
      .status(200)
      .json({ success: true, message: "Ride cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling ride:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const startTrip = async (req, res) => {
  const { rideId } = req.params;
  try {
    const ride = await rideModel.findById(rideId);
    if (!ride || ride.status !== "assigned") {
      return res.status(400).json({ message: "Cannot start trip" });
    }

    ride.status = "in_transit";
    ride.started_at = new Date();
    await ride.save();

    io.emit("rides:update");
    io.to(ride.customerSocketId).emit("ride:started", { rideId });

    return res.json(ride);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const cancelAssignRide = async (req, res) => {
  const { rideId } = req.params;
  const driverId = req.user.id;

  try {
    const ride = await rideModel.findById(rideId);
    if (!ride || ride.status === "in_transit") {
      return res
        .status(400)
        .json({
          message: "Ride cannot be cancelled as it is already in transit",
        });
    }

    if (ride.driver.toString() !== driverId) {
      return res
        .status(403)
        .json({ message: "You are not the assigned rider for this ride" });
    }

    ride.driver = null;
    ride.status = "pending";
    await ride.save();

    const customer = await customerModel.findById(ride.customer);
    if (customer?.socketId) {
      io.to(customer.socketId).emit("ride:cancelled", {
        message:
          "Your ride has been cancelled by the driver. Please wait for another rider.",
      });
    }

    io.emit("rides:update");

    res.json({ message: "Ride cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const trackRide = async (req, res) => {
  const { rideId } = req.params;
  try {
    const ride = await rideModel
      .findById(rideId)
      .populate("customer", "fullName phone")
      .populate("driver", "fullName phone");

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const currentLat = ride.origin_latitude;
    const currentLng = ride.origin_longitude;

    return res.status(200).json({
      rideId: ride._id,
      status: ride.status,
      driver: ride.driver,
      customer: ride.customer,
      rideTime: ride.ride_time,

      origin_address: ride.origin_address,
      destination_address: ride.destination_address,

      origin_latitude: ride.origin_latitude,
      origin_longitude: ride.origin_longitude,
      destination_latitude: ride.destination_latitude,
      destination_longitude: ride.destination_longitude,

      currentLocation: {
        latitude: currentLat,
        longitude: currentLng,
      },
    });
  } catch (err) {
    console.error("Error tracking ride:", err);
    return res.status(500).json({ message: "Server error", error: err });
  }
};

export const getAllRides = async (req, res) => {
  try {
    const rides = await rideModel
      .find()
      .sort({ created_at: -1 })
      .populate("customer", "fullName phone")
      .populate("driver", "fullName phone")
      .exec();

    res.status(200).json(rides);
  } catch (error) {
    console.error("Error fetching all rides:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getRideStats = async (req, res) => {
  try {
    const totalRides = await rideModel.countDocuments();
    const completedRides = await rideModel.countDocuments({
      status: "completed",
    });
    const pendingRides = await rideModel.countDocuments({ status: "pending" });
    const assignedRides = await rideModel.countDocuments({
      status: "assigned",
    });

    res.status(200).json({
      totalRides,
      completedRides,
      pendingRides,
      assignedRides,
    });
  } catch (error) {
    console.error("Error fetching ride stats:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getPaymentTrends = async (req, res) => {
  try {
    const trends = await rideModel.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$created_at" },
          },
          total: { $sum: "$fare_price" },
        },
      },
      // Sort by month
      { $sort: { _id: 1 } },

      {
        $project: {
          _id: 0,
          name: "$_id",
          value: "$total",
        },
      },
    ]);
    res.status(200).json(trends);
  } catch (error) {
    console.error("Error fetching payment trends:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
