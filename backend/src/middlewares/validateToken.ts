import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export interface CustomRequest extends Request {
    user?: JwtPayload;
}

export const validateUserToken = (req: CustomRequest, res: Response, next: NextFunction): void => {
    const token: string | undefined = req.header('authorization')?.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "Token not found" });
        return;
    }
    try {
        const verified: JwtPayload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.user = verified;
        req.user.id = verified._id; // I have no clue why, but if this is not done sometimes it throws a tantrum
        next();
    } catch (error: any) {
        res.status(401).json({ error: "Access denied, bad token" });
    }
};

// Can only be used after validateUserToken
export const validateAdmin = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    if (req.user?.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: "Access denied" });
    }
};

export const checkAccess = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.body.email) {
        res.status(400).json({ error: "User email is required" });
        return;
    }
    if (req.user?.isAdmin) {
        next();
    } else if (req.body.email===req.user?.email) {
        next()
    } else {
        res.status(403).json({ error: "Access denied" });
    }
}