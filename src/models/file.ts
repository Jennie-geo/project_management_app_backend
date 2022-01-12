import mongoose from "mongoose";
import projects from "./projectModel";
const fileSystem = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    projectId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: projects,
    },
  },
  { timestamps: true }
);

const fileModel = mongoose.model("file", fileSystem);

export default fileModel;
