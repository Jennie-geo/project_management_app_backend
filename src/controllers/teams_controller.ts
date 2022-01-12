import express, { Request, Response } from "express";
import Joi from "joi";
import Team from "../models/teamModel";
import Project from "../models/projectModel";
import taskModel from "../models/task";
import UserModel from "../models/user";

type customRequest = Request & {
  user?: { _id?: string; email?: string; fullname?: string };
};

export async function createTeam(req: customRequest, res: Response) {
  try {
    const taskSchemaJoi = Joi.object({
      teamName: Joi.string().required(),
      about: Joi.string().required(),
      projectId: Joi.string().required(),
    });

    const validationResult = taskSchemaJoi.validate(req.body);
    //check for errors
    if (validationResult.error) {
      console.log(
        "create Team Error:",
        validationResult.error.details[0].message
      );
      return res.status(400).json({
        msg: validationResult.error.details[0].message,
      });
    }
    const { teamName, about, assignee, role, projectId } = req.body;

    //check for project using Id
    const project = await Project.findOne({ _id: projectId });
    const ownerId = req.user?._id;
    console.log(project);
    if (!project) {
      return res.status(400).json({
        status: "failed",
        message: "This project does not exist.",
      });
    }

    const newTeam = await Team.create({
      teamName,
      about,
      createdBy: ownerId,
      projectId,
    });
    return res.status(201).json({
      message: "Team created successfully",
      teamCreated: newTeam,
      membersStatus: "No members added",
    });
  } catch (err) {
    console.log("Server Error:", err);
    res.json({
      message: err,
    });
  }
}

//owner adding members to a team
export async function addMemberToTeam(req: customRequest, res: Response) {
  const { newMemberID, role } = req.body;
  const teamId = req.params.teamId;
  const user_id = req.user!._id;
  try {
    const teamExist = await Team.exists({ _id: teamId });
    if (!teamExist) {
      return res.status(404).json({
        msg: "Team does not exist.",
      });
    }
    const team = await Team.findOne({ _id: teamId, createdBy: user_id });
    if (team !== null) {
      const alreadyMember = team.members.find(
        (member) => String(member.user) === newMemberID
      );
      if (alreadyMember) {
        return res.status(400).json({
          status: "failed",
          message: "Member already exists in the team",
        });
      }
      team.members.push({
        user: newMemberID,
        role,
      });

      await team.save();

      // const updatedteam = await Team.findByIdAndUpdate(
      //   { _id: teamId },
      //   { members: team.members },
      //   { new: true }
      // );

      return res.status(200).json({
        status: "success",
        data: team,
      });
    } else {
      return res.status(404).json({
        status: "failed",
        message: "You don't have access to add members to this team.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "failed",
      message: error,
    });
  }
}

//update team details
export async function updateTeamDetails(req: customRequest, res: Response) {
  const user_id = req.user!._id;
  const project_id = req.params.id;
  const { teamName, about } = req.body;

  try {
    let findTeam = await Team.findOne({
      _id: project_id,
      createdBy: user_id,
    });
    if (!findTeam) {
      return res.status(404).json({
        status: "failed",
        message: "Team does not exist",
      });
    }
    let updatedTeam = await Team.findOneAndUpdate(
      { _id: req.params.id },
      {
        teamName: teamName,
        about: about,
      },
      { new: true }
    );
    res.status(200).json({
      status: "success",
      data: updatedTeam,
    });
  } catch (error) {
    res.status(200).json({
      status: "Failed",
      Error: error,
    });
  }
}

//get all team members
export async function getAllTeamMembers(req: customRequest, res: Response) {
  const { teamId } = req.params;

  try {
    const team = await Team.findOne({ _id: teamId })
      .populate("members.user")
      .lean();

    if (!team) {
      return res.status(400).json({
        Status: "Failed",
        message: "Team does not exists",
      });
    }
    const { members } = team; //use of var
    const tasksInTeam = await taskModel.find({ team: team._id });
    console.log(tasksInTeam);
    const memberWithTask = members.map((member) => {
      const memberUser = member.user;
      const taskForMember = tasksInTeam.filter((task) => {
        console.log("task.assignee:", task.assignee);
        return String(task.assignee) === String(memberUser._id);
      });
      member["tasks"] = taskForMember;

      return member;
    });
    return res.status(200).json({
      message: "successful",
      members: memberWithTask,
      team: team,
    });
  } catch (err: any) {
    return res.status(400).json({
      error: err.message,
    });
  }
}

//leave a team
export async function leaveTeam(req: customRequest, res: Response) {
  const { teamId } = req.params;
  const id = req.user?._id;
  try {
    const team = await Team.findOne({ _id: teamId });

    if (!team) {
      return res.status(200).json({
        message: `Team doesn't exists`,
      });
    }

    const { members, teamName } = team;
    const user = members.filter((val) => val.toString() == id?.toString()); //the USE OF loose equality
    if (user.length == 0) {
      return res.status(400).json({
        message: `Sorry, you are not a member of team ${teamName}`,
      });
    }

    const updatedMembers = members.filter((val) => {
      return val.toString() !== id?.toString();
    });

    const updatedteam = await Team.findByIdAndUpdate(
      { _id: teamId },
      { members: updatedMembers },
      { new: true }
    );
    return res.status(200).json({
      message: `Successful removal from team ${teamName}`,
      updatedMembers: updatedMembers,
      updatedteam: updatedteam,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
}

///get information for all teammabers
export async function getUserDetails(req: customRequest, res: Response) {
  const { teamId } = req.params;
  const teamInfo = await Team.findOne({ _id: teamId }).populate("members.user");
  try {
    if (!teamInfo) {
      return res.status(400).json({
        message: "Team doesn't exists",
      });
    }

    const teamMembersArray = teamInfo.members;
    console.log(teamMembersArray, "teamMembersArray");
    const memberInfo = teamMembersArray.map(async ({ user, role }) => {
      console.log("This is the member info block of code");
      let member = await UserModel.findOne({ _id: user._id });

      let assignedTasks = await taskModel.find({ assignee: user._id });
      let closedTasks = await taskModel.find({
        assignee: user._id,
        status: "done",
      });

      let numberOfAssignedTasks = assignedTasks.length;
      let numberOfClosedtasks = closedTasks.length;
      let numberOfOpenedtasks = numberOfAssignedTasks - numberOfClosedtasks;

      const userDetails = {
        fullname: member?.fullname,
        role,
        location: member?.location,
        numberOfClosedtasks: numberOfClosedtasks,
        numberOfOpenedtasks: numberOfOpenedtasks,
      };
      console.log(userDetails, "userDetails");
      return userDetails;
    });

    const memberObj = await Promise.all(memberInfo);
    return res.status(200).json({
      message: "success",
      userDetails: memberObj,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed",
      error: error,
    });
  }
}

export async function getAllTeams(req: customRequest, res: Response) {
  try {
    const userId = req.user?._id;
    const teams = await Team.find({ createdBy: userId }).populate(
      "members.user"
    );
    res.json({
      message: "Task retrieval successful.",
      teams,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server Error: Unable to get all teams",
    });
  }
}
