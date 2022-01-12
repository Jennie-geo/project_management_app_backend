"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryUpload = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
const parser_1 = __importDefault(require("datauri/parser"));
const dUriParser = new parser_1.default();
const cloudinaryV2 = cloudinary_1.default.v2;
cloudinaryV2.config({
    cloud_name: process.env.CLOUDINARY_CLOUDNAME,
    api_key: process.env.CLOUDINARY_APIKEY,
    api_secret: process.env.CLOUDINARY_APISECRET,
    secure: true,
});
async function cloudinaryUpload(filename, buffer) {
    const parser = dUriParser.format(filename, buffer);
    const apiResponse = await cloudinaryV2.uploader
        .upload(parser.content, {
        overwrite: false,
    })
        .catch((err) => {
        console.log("cloudinary uploadFile Error:", err);
        return null;
    });
    return apiResponse;
}
exports.cloudinaryUpload = cloudinaryUpload;
