import mongoose from "mongoose";
import user from "./user";
import file from "./file";
import comment from "./comments";
import team from "./teamModel";

export interface TaskInterface {
  title: String;
  description: String;
  status: String;
  owner: String;
  assignee: String;
  fileUploads: String[];
  comments: String[];
  dueDate: Date;
  createdAt: Date;
  projectId: String;
  tag: String;
  team: String;
}

const taskSchema = new mongoose.Schema(
  {
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
      type: mongoose.SchemaTypes.ObjectId,
      ref: user,
      required: true,
    },
    assignee: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: user,
      required: true,
    },
    fileUploads: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: file,
      },
    ],
    comments: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: comment,
      },
    ],
    dueDate: {
      type: mongoose.SchemaTypes.Date,
      required: true,
    },
    tag: {
      type: String,
      required: true,
    },
    team: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: team,
    },
  },
  { timestamps: true }
);

const taskModel = mongoose.model<TaskInterface>("task", taskSchema);

export default taskModel;
