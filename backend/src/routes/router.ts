import express from "express";
import columnRouter from "./columnRoutes";
import cardRouter from "./cardRoutes";
import boardRouter from "./boardRoutes";
import userRouter from "./userRoutes";

const router = express.Router();

router.use("/user", userRouter)
router.use("/column", columnRouter);
router.use("/card", cardRouter);
router.use("/board", boardRouter);

export default router;