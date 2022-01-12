"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = __importDefault(require("./user"));
const activitySchema = new mongoose_1.default.Schema({
    message: {
        type: String,
        required: true,
    },
    projectId: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose_1.default.SchemaTypes.ObjectId,
        ref: user_1.default,
        required: true,
    },
}, { timestamps: true });
const activityModel = mongoose_1.default.model("activity", activitySchema);
exports.default = activityModel;
