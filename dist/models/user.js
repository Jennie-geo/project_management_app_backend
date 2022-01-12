"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    facebookId: {
        type: String,
        required: false,
    },
    googleId: {
        type: String,
        required: false,
    },
    gender: {
        type: String,
    },
    role: {
        type: String,
    },
    location: {
        type: String,
    },
    about: {
        type: String,
    },
    profileImage: {
        type: String,
    },
});
const UserModel = mongoose_1.default.model("user", userSchema);
exports.default = UserModel;
