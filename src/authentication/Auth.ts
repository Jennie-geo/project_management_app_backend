import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../models/user";

interface PayLoadInterface {
  id: string;
}

async function authorization(req: Request, res: Response, next: NextFunction) {
  if (!req.user && !req.headers.token) {
    console.log("user:", req.user, "");
    return res.status(401).json({ msg: "You're not logged in, please login." });
  }
  if (!req.user) {
    console.log("user not found:", req.user);
    //user has not been attached to the request object
    try {
      const jwtPayLoad = jwt.verify(
        req.headers.token as string,
        process.env.JWT_SECRETKEY as string
      );
      const { id } = jwtPayLoad as PayLoadInterface;
      const user = await UserModel.findById(id);
      if (user === null) {
        console.log("user is null")
        return res.status(404).json({
          msg: "User not found.",
        });
      }
      //set user in the request object
      req.user = user!;
    } catch (err) {
      //invalid token was found

      return res.status(401).json({
        msg: "Invalid Token, please login.",
      });
    }
  }

  next();
}
export { authorization };
