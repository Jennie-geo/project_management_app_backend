import mongoose from "mongoose";
import user from "./user";

export interface ProjectInterface {
  owner: string;
  name: string;
  collaborators: [{ email: string; isVerified: boolean }];
  createdAt: string;
  updatedAt: string;
}

const projectsSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: user,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    collaborators: [{ email: String, isVerified: Boolean }],
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model<ProjectInterface>("projects", projectsSchema);

export default Project;
