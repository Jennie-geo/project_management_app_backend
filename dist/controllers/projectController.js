"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidCollaborators = exports.getAllProject = exports.createInvite = exports.updateProject = exports.createProject = void 0;
const projectModel_1 = __importDefault(require("../models/projectModel"));
const projectModel_2 = __importDefault(require("../models/projectModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const nodemailer_1 = __importDefault(require("../utils/nodemailer"));
const user_1 = __importDefault(require("../models/user"));
async function createProject(req, res) {
    var _a;
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { projectname } = req.body;
    const projectsSchema = joi_1.default.object({
        projectname: joi_1.default.string().min(3).max(255).required(),
    });
    const projectValidate = projectsSchema.validate(req.body);
    if (projectValidate.error) {
        return res.status(400).json({
            message: projectValidate.error.details[0].message,
        });
    }
    let findProject = await projectModel_2.default.findOne({ name: projectname });
    if (findProject) {
        res.status(400).json({
            message: "Project name already exist",
        });
    }
    const newProject = await projectModel_2.default.create({
        owner: user_id,
        name: projectname,
        collaborators: [],
    });
    return res.status(201).json({
        status: "success",
        data: newProject,
    });
}
exports.createProject = createProject;
async function updateProject(req, res) {
    var _a;
    //extract details
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const projectId = req.params.projectId;
    const { projectname } = req.body;
    //validating
    const projectSchema = joi_1.default.object({
        projectname: joi_1.default.string().min(3).max(255).required(),
    });
    //error messages
    const projectUpdate = projectSchema.validate(req.body);
    if (projectUpdate.error) {
        return res.status(400).json({
            message: projectUpdate.error.details[0].message,
        });
    }
    const project = await projectModel_1.default.findById(projectId);
    if (!project) {
        return res.status(404).json({
            msg: "Project does not exist.",
        });
    }
    if (project.owner !== (user_id === null || user_id === void 0 ? void 0 : user_id.toString())) {
        return res.status(403).json({
            msg: "You are not authorized to update this project.",
        });
    }
    //accessing database
    let updateProject = await projectModel_1.default.findOneAndUpdate({ _id: projectId }, { name: projectname }, { new: true });
    res.status(200).json({
        updatedProject: updateProject,
    });
}
exports.updateProject = updateProject;
async function createInvite(req, res) {
    var _a, _b, _c;
    let { email, projectId } = req.body;
    try {
        const fullname = (_a = req.user) === null || _a === void 0 ? void 0 : _a.fullname;
        const user_id = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        const emailSchema = joi_1.default.object({
            email: joi_1.default.string().required().min(6).max(225).email(),
            projectId: joi_1.default.string().min(3).max(255).required(),
        });
        const emailValidate = emailSchema.validate(req.body);
        if (emailValidate.error) {
            return res.status(400).json({
                message: emailValidate.error.details[0].message,
            });
        }
        let isVerifiedEmail;
        let body = "";
        let findProject = await projectModel_2.default.findOne({
            owner: user_id,
            _id: projectId,
        });
        if (!findProject)
            return res.status(400).json({
                message: ` Project does not exist on this user`,
            });
        if (email === ((_c = req.user) === null || _c === void 0 ? void 0 : _c.email)) {
            return res.status(400).json({
                message: "You cannot invite yourself.",
            });
        }
        isVerifiedEmail = await user_1.default.findOne({ email: email });
        if (!isVerifiedEmail) {
            findProject.collaborators.push({ email: email, isVerified: false });
            await findProject.save();
            const token = jsonwebtoken_1.default.sign({ owner: user_id, projectId: findProject === null || findProject === void 0 ? void 0 : findProject._id, email: email }, process.env.JWT_SECRETKEY, { expiresIn: process.env.JWT_EMAIL_EXPIRES });
            const isDeployed = process.env.NODE_ENV === "production";
            const link = `${process.env.HOME_URL}${isDeployed ? "" : ":" + process.env.PORT}/users/inviteUser/${token}`;
            body = `
                You have be invited by ${fullname}
                to join the ${findProject.name}project. please click on this link ${link}`;
            if (process.env.NODE_ENV != "test") {
                (0, nodemailer_1.default)(email, body);
            }
            await findProject.save();
            return res.status(200).json({
                message: `email invite have been sent to ${email}`,
                token: link,
            });
        }
        else {
            findProject.collaborators.push({ email: email, isVerified: true });
            body = `
                  You have be invited by ${fullname}
                  to  the ${findProject.name}project.`;
            if (process.env.NODE_ENV != "test") {
                (0, nodemailer_1.default)(email, body);
            }
            await findProject.save();
            return res.status(200).json({
                message: `${email} have been added to ${findProject.name} project`,
            });
        }
    }
    catch (err) {
        res.status(500).json({
            message: "Unable to Invite collaborator",
        });
    }
}
exports.createInvite = createInvite;
// Logic to get all projects for user( either as owner or collaborator)
async function getAllProject(req, res) {
    var _a, _b;
    //extract details
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const projects = await projectModel_1.default.find({
            $or: [{ owner: user_id }, { "collaborators.email": (_b = req.user) === null || _b === void 0 ? void 0 : _b.email }],
        });
        res.status(200).json({ projects });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Server Error: Unable to getAll Project",
        });
    }
}
exports.getAllProject = getAllProject;
async function getValidCollaborators(req, res) {
    try {
        const projects = await projectModel_2.default.findById(req.params.projectId);
        if (!projects) {
            return res.status(403).json({
                message: "Unable to show valid collaborators, please check your data and try again.",
            });
        }
        const validCollabArr = projects.collaborators.filter((project) => project.isVerified);
        const assignees = await user_1.default.find({
            $or: validCollabArr.map((obj) => ({ email: obj.email })),
        });
        return res.status(200).json({
            assignees,
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Server error, unable to get valid collaborator",
        });
    }
}
exports.getValidCollaborators = getValidCollaborators;
