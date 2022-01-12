"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../models/user"));
async function authorization(req, res, next) {
    if (!req.user && !req.headers.token) {
        console.log("user:", req.user, "");
        return res.status(401).json({ msg: "You're not logged in, please login." });
    }
    if (!req.user) {
        console.log("user not found:", req.user);
        //user has not been attached to the request object
        try {
            const jwtPayLoad = jsonwebtoken_1.default.verify(req.headers.token, process.env.JWT_SECRETKEY);
            const { id } = jwtPayLoad;
            const user = await user_1.default.findById(id);
            if (user === null) {
                console.log("user is null");
                return res.status(404).json({
                    msg: "User not found.",
                });
            }
            //set user in the request object
            req.user = user;
        }
        catch (err) {
            //invalid token was found
            return res.status(401).json({
                msg: "Invalid Token, please login.",
            });
        }
    }
    next();
}
exports.authorization = authorization;
