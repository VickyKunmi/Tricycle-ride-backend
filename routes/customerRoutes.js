import express from "express";
import {
  registerCustomer,
  verifyOTP,
  loginCustomer,
  getAllCustomers,
  savePushToken,
  getTotalCustomersCount,
  getCustomerGrowth,
} from "../controllers/customerController.js";

const customerRouter = express.Router();

customerRouter.post("/register", registerCustomer);
customerRouter.post("/verify-otp", verifyOTP);
customerRouter.post("/login", loginCustomer);
customerRouter.post("/push-token", savePushToken);
customerRouter.get("/customers", getAllCustomers);
customerRouter.get("/total", getTotalCustomersCount);
customerRouter.get("/growth", getCustomerGrowth);


export default customerRouter;
