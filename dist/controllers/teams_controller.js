"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTeams = exports.getUserDetails = exports.leaveTeam = exports.getAllTeamMembers = exports.updateTeamDetails = exports.addMemberToTeam = exports.createTeam = void 0;
const joi_1 = __importDefault(require("joi"));
const teamModel_1 = __importDefault(require("../models/teamModel"));
const projectModel_1 = __importDefault(require("../models/projectModel"));
const task_1 = __importDefault(require("../models/task"));
const user_1 = __importDefault(require("../models/user"));
async function createTeam(req, res) {
    var _a;
    try {
        const taskSchemaJoi = joi_1.default.object({
            teamName: joi_1.default.string().required(),
            about: joi_1.default.string().required(),
            projectId: joi_1.default.string().required(),
        });
        const validationResult = taskSchemaJoi.validate(req.body);
        //check for errors
        if (validationResult.error) {
            console.log("create Team Error:", validationResult.error.details[0].message);
            return res.status(400).json({
                msg: validationResult.error.details[0].message,
            });
        }
        const { teamName, about, assignee, role, projectId } = req.body;
        //check for project using Id
        const project = await projectModel_1.default.findOne({ _id: projectId });
        const ownerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log(project);
        if (!project) {
            return res.status(400).json({
                status: "failed",
                message: "This project does not exist.",
            });
        }
        const newTeam = await teamModel_1.default.create({
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
    }
    catch (err) {
        console.log("Server Error:", err);
        res.json({
            message: err,
        });
    }
}
exports.createTeam = createTeam;
//owner adding members to a team
async function addMemberToTeam(req, res) {
    const { newMemberID, role } = req.body;
    const teamId = req.params.teamId;
    const user_id = req.user._id;
    try {
        const teamExist = await teamModel_1.default.exists({ _id: teamId });
        if (!teamExist) {
            return res.status(404).json({
                msg: "Team does not exist.",
            });
        }
        const team = await teamModel_1.default.findOne({ _id: teamId, createdBy: user_id });
        if (team !== null) {
            const alreadyMember = team.members.find((member) => String(member.user) === newMemberID);
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
        }
        else {
            return res.status(404).json({
                status: "failed",
                message: "You don't have access to add members to this team.",
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            status: "failed",
            message: error,
        });
    }
}
exports.addMemberToTeam = addMemberToTeam;
//update team details
async function updateTeamDetails(req, res) {
    const user_id = req.user._id;
    const project_id = req.params.id;
    const { teamName, about } = req.body;
    try {
        let findTeam = await teamModel_1.default.findOne({
            _id: project_id,
            createdBy: user_id,
        });
        if (!findTeam) {
            return res.status(404).json({
                status: "failed",
                message: "Team does not exist",
            });
        }
        let updatedTeam = await teamModel_1.default.findOneAndUpdate({ _id: req.params.id }, {
            teamName: teamName,
            about: about,
        }, { new: true });
        res.status(200).json({
            status: "success",
            data: updatedTeam,
        });
    }
    catch (error) {
        res.status(200).json({
            status: "Failed",
            Error: error,
        });
    }
}
exports.updateTeamDetails = updateTeamDetails;
//get all team members
async function getAllTeamMembers(req, res) {
    const { teamId } = req.params;
    try {
        const team = await teamModel_1.default.findOne({ _id: teamId })
            .populate("members.user")
            .lean();
        if (!team) {
            return res.status(400).json({
                Status: "Failed",
                message: "Team does not exists",
            });
        }
        const { members } = team; //use of var
        const tasksInTeam = await task_1.default.find({ team: team._id });
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
    }
    catch (err) {
        return res.status(400).json({
            error: err.message,
        });
    }
}
exports.getAllTeamMembers = getAllTeamMembers;
//leave a team
async function leaveTeam(req, res) {
    var _a;
    const { teamId } = req.params;
    const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    try {
        const team = await teamModel_1.default.findOne({ _id: teamId });
        if (!team) {
            return res.status(200).json({
                message: `Team doesn't exists`,
            });
        }
        const { members, teamName } = team;
        const user = members.filter((val) => val.toString() == (id === null || id === void 0 ? void 0 : id.toString())); //the USE OF loose equality
        if (user.length == 0) {
            return res.status(400).json({
                message: `Sorry, you are not a member of team ${teamName}`,
            });
        }
        const updatedMembers = members.filter((val) => {
            return val.toString() !== (id === null || id === void 0 ? void 0 : id.toString());
        });
        const updatedteam = await teamModel_1.default.findByIdAndUpdate({ _id: teamId }, { members: updatedMembers }, { new: true });
        return res.status(200).json({
            message: `Successful removal from team ${teamName}`,
            updatedMembers: updatedMembers,
            updatedteam: updatedteam,
        });
    }
    catch (error) {
        return res.status(400).json({
            message: error.message,
        });
    }
}
exports.leaveTeam = leaveTeam;
///get information for all teammabers
async function getUserDetails(req, res) {
    const { teamId } = req.params;
    const teamInfo = await teamModel_1.default.findOne({ _id: teamId }).populate("members.user");
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
            let member = await user_1.default.findOne({ _id: user._id });
            let assignedTasks = await task_1.default.find({ assignee: user._id });
            let closedTasks = await task_1.default.find({
                assignee: user._id,
                status: "done",
            });
            let numberOfAssignedTasks = assignedTasks.length;
            let numberOfClosedtasks = closedTasks.length;
            let numberOfOpenedtasks = numberOfAssignedTasks - numberOfClosedtasks;
            const userDetails = {
                fullname: member === null || member === void 0 ? void 0 : member.fullname,
                role,
                location: member === null || member === void 0 ? void 0 : member.location,
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
    }
    catch (error) {
        return res.status(500).json({
            message: "Failed",
            error: error,
        });
    }
}
exports.getUserDetails = getUserDetails;
async function getAllTeams(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const teams = await teamModel_1.default.find({ createdBy: userId }).populate("members.user");
        res.json({
            message: "Task retrieval successful.",
            teams,
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "Server Error: Unable to get all teams",
        });
    }
}
exports.getAllTeams = getAllTeams;
