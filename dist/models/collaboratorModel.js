"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const collaboratorsSchema = new mongoose_1.default.Schema({
    ownerId: {
        type: String,
    },
    projectId: {
        type: String,
    },
    collaborator: {
        type: String,
        required: true,
        unique: true,
    },
    isVerified: {
        type: Boolean,
        required: true,
    },
}, {
    timestamps: true,
});
const collaborator = mongoose_1.default.model("collaborator", collaboratorsSchema);
exports.default = collaborator;
