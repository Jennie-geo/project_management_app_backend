"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const projectModel_1 = __importDefault(require("./projectModel"));
const fileSystem = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    projectId: {
        type: mongoose_1.default.SchemaTypes.ObjectId,
        ref: projectModel_1.default,
    },
}, { timestamps: true });
const fileModel = mongoose_1.default.model("file", fileSystem);
exports.default = fileModel;
