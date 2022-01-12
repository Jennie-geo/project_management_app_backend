import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

interface RequestInterface extends Request {
  user?: string | JwtPayload;
}

interface UserInterface {
  _id: string;
  email: string;
  password: string;
  fullname: string;
  createdAt: number;
}

export { RequestInterface, UserInterface };
