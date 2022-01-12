import cloudinary from "cloudinary";
import DatauriParser from "datauri/parser";

const dUriParser = new DatauriParser();

const cloudinaryV2 = cloudinary.v2;
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET,
  secure: true,
});

export async function cloudinaryUpload(filename: string, buffer: Buffer) {
  const parser = dUriParser.format(filename, buffer);
  const apiResponse = await cloudinaryV2.uploader
    .upload(parser.content as string, {
      overwrite: false,
    })
    .catch((err) => {
      console.log("cloudinary uploadFile Error:", err);
      return null;
    });
  return apiResponse;
}
