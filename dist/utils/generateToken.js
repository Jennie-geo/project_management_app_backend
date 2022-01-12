"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJwtToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
//generation of token
const secret = process.env.JWT_SECRETKEY;
const days = process.env.JWT_SIGNIN_EXPIRES;
const generateJwtToken = (user) => {
    const { _id, password, email } = user;
    const id = _id;
    return jsonwebtoken_1.default.sign({ id }, secret, {
        expiresIn: days,
    });
};
exports.generateJwtToken = generateJwtToken;
