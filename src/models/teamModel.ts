import { string } from "joi";
import mongoose from "mongoose";
import UserModel from "./user";
import { TaskInterface } from "./task";
import { UserInterface } from "../interfaces/interface";

export interface teamType {
  teamName: string;
  about: string;
  members: { user: UserInterface; role: string; tasks?: TaskInterface[] }[];
  projectId: string;
  createdBy: string;
  _id: string;
}

interface teamMembersObj {
  userId: string;
  email: string;
}

const teamModel = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: UserModel,
          required: true,
        },
        role: {
          type: String,
          required: true,
        },
      },
    ], //cool
    projectId: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Team = mongoose.model<teamType>("team", teamModel);

export default Team;
