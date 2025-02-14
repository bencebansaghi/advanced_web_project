import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Request, Response, Router, NextFunction } from "express";

dotenv.config();

import { IUser, User } from "../models/User";
import validateUserLogin from "../middlewares/validateLogin";
import validateUserRegister from "../middlewares/validateRegister";
import {
  validateUserToken,
  validateAdmin,
  CustomRequest,
} from "../middlewares/validateToken";
import { errorHandler } from "../middlewares/errorHandler";

const userRouter: Router = Router();

// Route to register a user
// Required in request body: { email, password, username, adminPass (optional) }
userRouter.post(
  "/register",
  validateUserRegister,
  errorHandler,
  async (req: Request, res: Response, next: NextFunction) => {
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
      if (req.body.adminPass) {
        if (!process.env.ADMIN_PASS) {
          console.log("Cannot find admin pass in env variables");
          res.status(500).json({ error: "Internal server error" });
          return;
        }
        if (req.body.adminPass==process.env.ADMIN_PASS) {
          new_user.isAdmin = true;
        } else {
          res.status(400).json({ error: "Incorrect admin password" });
          return
        }
      }

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

// Route to get all users for admin
// Required in request headers: { Authorization: Bearer <token> }
userRouter.get(
  "/all",
  validateUserToken,
  validateAdmin,
  async (req: CustomRequest, res: Response) => {
    const users = await User.find().select("-password");
    if (!users || users.length == 0) {
      res.status(404).json({ error: "No users found" });
    } else {
      console.log(users)
      res.status(200).json({ users: users });
    }
  }
);

// Route to get info on own account
// Required in request headers: { Authorization: Bearer <token> }
userRouter.get(
  "/",
  validateUserToken,
  async (req: CustomRequest, res: Response) => {
    const user = await User.findById(req.user?.id).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
    } else {
      res.status(200).json({ user: user });
    }
  }
);

export default userRouter;
