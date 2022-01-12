import jwt from "jsonwebtoken";
import { UserInterface } from "../interfaces/interface";

//generation of token
const secret: string = process.env.JWT_SECRETKEY as string;
const days: string = process.env.JWT_SIGNIN_EXPIRES as string;
export const generateJwtToken = (user: UserInterface) => {
  const { _id, password, email } = user;
  const id = _id;
  return jwt.sign({ id }, secret, {
    expiresIn: days,
  });
};
