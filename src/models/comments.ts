import mongoose from "mongoose";
import user from "./user";
const commentSchema = new mongoose.Schema(
  {
    commenter: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: user,
    },

    body: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const commentModel = mongoose.model("comment", commentSchema);

export default commentModel;
