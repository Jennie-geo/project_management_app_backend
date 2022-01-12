import mongoose from "mongoose";

interface collaboratorInterface {
  ownerId: string;
  projectId: string;
  collaborator: string;
  createdAt: string;
  updatedAt: string;
}

const collaboratorsSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

const collaborator = mongoose.model("collaborator", collaboratorsSchema);

export default collaborator;
