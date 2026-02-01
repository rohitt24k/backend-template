import express from "express";
import { AuthRouter } from "./auth.route";
const MainRouter = express.Router();

MainRouter.use("/auth", AuthRouter);

export { MainRouter };
