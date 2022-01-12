"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = __importDefault(require("./user"));
const file_1 = __importDefault(require("./file"));
const comments_1 = __importDefault(require("./comments"));
const teamModel_1 = __importDefault(require("./teamModel"));
const taskSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true,
    },
    projectId: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["backlog", "todo", "done"],
        required: true,
        default: "backlog",
    },
    owner: {
        type: mongoose_1.default.SchemaTypes.ObjectId,
        ref: user_1.default,
        required: true,
    },
    assignee: {
        type: mongoose_1.default.SchemaTypes.ObjectId,
        ref: user_1.default,
        required: true,
    },
    fileUploads: [
        {
            type: mongoose_1.default.SchemaTypes.ObjectId,
            ref: file_1.default,
        },
    ],
    comments: [
        {
            type: mongoose_1.default.SchemaTypes.ObjectId,
            ref: comments_1.default,
        },
    ],
    dueDate: {
        type: mongoose_1.default.SchemaTypes.Date,
        required: true,
    },
    tag: {
        type: String,
        required: true,
    },
    team: {
        type: mongoose_1.default.SchemaTypes.ObjectId,
        ref: teamModel_1.default,
    },
}, { timestamps: true });
const taskModel = mongoose_1.default.model("task", taskSchema);
exports.default = taskModel;
