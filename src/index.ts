import express from "express";
import { MainRouter } from "./routes/mainRoute";
import { errorHandler } from "./middleware/error.middleware";
import morgan from "morgan";
import { config } from "dotenv";

config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(morgan("combined"));

app.use("/api/v1", MainRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
