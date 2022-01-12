"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = __importDefault(require("./user"));
const commentSchema = new mongoose_1.default.Schema({
    commenter: {
        type: mongoose_1.default.SchemaTypes.ObjectId,
        ref: user_1.default,
    },
    body: {
        type: String,
        required: true,
    },
}, { timestamps: true });
const commentModel = mongoose_1.default.model("comment", commentSchema);
exports.default = commentModel;
