import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Request, Response, Router, NextFunction } from "express";

dotenv.config()

import { IUser, User } from "../models/User";
import { IColumn, Column } from "../models/Column";
import { ICard, Card } from "../models/Card";
import { IBoard, Board } from "../models/Board";
import validateUserLogin from "../middlewares/validateLogin";
import validateUserRegister from "../middlewares/validateRegister";
import { validateUserToken, validateAdmin, CustomRequest, checkAccess } from "../middlewares/validateToken";
import { errorHandler } from "../middlewares/errorHandler";
import mongoose from "mongoose";

const userRouter: Router = Router();

// Route to login a user
// Required in request body: { email, password, username, isAdmin (optional) }
userRouter.post(
    "/register",
    validateUserRegister,
    errorHandler,
    async (req: Request, res: Response) => {
      try {
        const exists = await User.findOne({ email: req.body.email });
        if (exists) {
          res.status(403).json({ error: "Email already in use" });
          return;
        }
  
        const original_password = req.body.password;
        const hashed_password = bcrypt.hashSync(
          original_password,
          bcrypt.genSaltSync(10)
        );
  
        const new_user: IUser = new User({
          username: req.body.username,
          password: hashed_password,
          email: req.body.email,
        });
        if (req.body.isAdmin) new_user.isAdmin = req.body.isAdmin;
  
        const savedUser = await new_user.save();
  
        res.status(201).send();
      } catch (error) {
        console.error("Error during user registration:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );
  
  // Route to login a user
  // Required in request body: { email, password }
  userRouter.post(
    "/login",
    validateUserLogin,
    errorHandler,
    async (req: Request, res: Response) => {
      const existing_user = await User.findOne({ email: req.body.email });
      if (!existing_user) {
        res.status(401).json({ error: "Incorrect email or password" });
        return;
      }
      if (bcrypt.compareSync(req.body.password, existing_user.password)) {
        const jwtPayload: JwtPayload = {
          _id: existing_user._id,
          username: existing_user.username,
          email: existing_user.email,
          isAdmin: existing_user.isAdmin,
        };
        if (!process.env.JWT_SECRET) {
          console.error(".env secret not found");
          res.status(500).json({ error: "Internal server error" });
          return;
        }
        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET as string);
  
        res.status(200).json({ token: token });
      } else {
        res.status(401).json({ error: "Incorrect email or password" });
      }
    }
  );

  export default userRouter