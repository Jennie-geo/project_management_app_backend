"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const joiUserSchema = joi_1.default.object({
    fullname: joi_1.default.string().required(),
    email: joi_1.default
        .string()
        .trim()
        .lowercase()
        .email({
        minDomainSegments: 2,
        tlds: {
            allow: ["com", "net", "in"],
        },
    }),
    password: joi_1.default.string().required(),
});
exports.default = joiUserSchema;
