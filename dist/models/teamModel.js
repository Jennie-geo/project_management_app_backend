"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = __importDefault(require("./user"));
const teamModel = new mongoose_1.default.Schema({
    teamName: {
        type: String,
        required: true,
    },
    about: {
        type: String,
        required: true,
    },
    members: [
        {
            user: {
                type: mongoose_1.default.SchemaTypes.ObjectId,
                ref: user_1.default,
                required: true,
            },
            role: {
                type: String,
                required: true,
            },
        },
    ],
    projectId: {
        type: String,
        required: true,
    },
    createdBy: {
        type: String,
        required: true,
    },
}, { timestamps: true });
const Team = mongoose_1.default.model("team", teamModel);
exports.default = Team;
