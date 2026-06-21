import express from "express";
import mongoose from "mongoose";
import { MainRouter } from "./routes/mainRoute";
import { errorHandler } from "./middlewares/error.middleware";
import morgan from "morgan";
import { config } from "dotenv";
import { MONGO_URI } from "./config/app-config";

config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(morgan("combined"));

app.use("/api/v1", MainRouter);

app.use(errorHandler);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
