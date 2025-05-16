import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(
      "mongodb+srv://victoryoyekunleolamide:fJJURZnxtsvmeC6n@cluster0.cxrt3vf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    .then(() => console.log("DB connected"));
};
