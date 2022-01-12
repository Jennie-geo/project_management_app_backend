import mongoose from "mongoose";
import user from "./user";

const activitySchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    projectId: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: user,
      required: true,
    },
  },
  { timestamps: true }
);

const activityModel = mongoose.model("activity", activitySchema);

export default activityModel;
