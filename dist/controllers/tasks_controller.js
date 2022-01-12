"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllActivities = exports.getTaskByProjectId = exports.getAllFiles = exports.getAllFilesByTask = exports.allFiles = exports.getYesterdayActivity = exports.getActivity = exports.updateTask = exports.getTasksByStatus = exports.uploadFileCloudinary = exports.createTask = exports.deleteTask = exports.getTasks = void 0;
const activity_1 = __importDefault(require("../models/activity"));
const task_1 = __importDefault(require("../models/task"));
const task_2 = __importDefault(require("../models/task"));
const cloudinary_1 = require("../utils/cloudinary");
const file_1 = __importDefault(require("../models/file"));
const joi_1 = __importDefault(require("joi"));
const user_1 = __importDefault(require("../models/user"));
const projectModel_1 = __importDefault(require("../models/projectModel"));
const teamModel_1 = __importDefault(require("../models/teamModel"));
async function getTasks(req, res) {
    const user = req.user;
    const user_tasks = await task_1.default
        .find({ assignee: user._id })
        .populate("comments")
        .populate("team")
        .populate("assignee");
    const completed = user_tasks.filter((task) => task.status === "done").length;
    const open = user_tasks.length - completed;
    res.status(200).json({
        tasks: user_tasks,
        completed,
        open,
    });
}
exports.getTasks = getTasks;
async function deleteTask(req, res) {
    const user = req.user;
    const task_id = req.params.id;
    if (!(await task_1.default.exists({
        _id: task_id,
    }))) {
        return res.status(404).json({
            message: "Task does not exist!",
        });
    }
    if (!(await task_1.default.exists({
        _id: task_id,
        owner: user._id,
    }))) {
        return res.status(403).json({
            message: "You are not authorized to delete this task.",
        });
    }
    const deletedTask = await task_1.default.findOneAndDelete({
        _id: task_id,
        owner: user._id,
    });
    res.status(200).json({
        message: "Deleted successfully",
        deletedTask,
    });
}
exports.deleteTask = deleteTask;
async function createTask(req, res) {
    var _a;
    try {
        const taskSchemaJoi = joi_1.default.object({
            title: joi_1.default.string().required(),
            description: joi_1.default.string().required(),
            assignee: joi_1.default.string().required(),
            projectId: joi_1.default.string().required(),
            dueDate: joi_1.default.string().required(),
            status: joi_1.default.string().valid("todo", "backlog"),
            tag: joi_1.default.string().required(),
            team: joi_1.default.string().required(),
        });
        const validationResult = taskSchemaJoi.validate(req.body);
        //check for errors
        if (validationResult.error) {
            console.log("validation error");
            return res.status(400).json({
                msg: validationResult.error.details[0].message,
            });
        }
        const { title, description, assignee, projectId, dueDate } = req.body;
        const getTask = await task_2.default.findOne({
            title: title,
            description: description,
            assignee: assignee,
        });
        const assigneeUser = await user_1.default.findById(assignee);
        if (!assigneeUser) {
            return res.status(400).json({
                msg: "Assignee does not exist.",
            });
        }
        if (getTask) {
            return res.status(400).json({
                msg: "Task with the title already exists for that particular user",
            });
        }
        const task = new task_2.default({
            ...req.body,
            owner: req.user._id,
        });
        await task.save();
        const teamFromDb = await teamModel_1.default.findById({ _id: req.body.team });
        if (teamFromDb && user_1.default.exists({ _id: req.body.assignee })) {
            teamFromDb.members.push({
                user: req.body.assignee,
                role: req.body.role || "developer",
            });
            await teamFromDb.save();
        }
        const assigner = (_a = req.user) === null || _a === void 0 ? void 0 : _a.fullname;
        await activity_1.default.create({
            message: `${assigner} assigned ${assigneeUser.fullname} to perform Task: ${task.title} task`,
            projectId,
            createdBy: req.user._id,
        });
        return res
            .status(201)
            .json({ msg: "Task created successfully", Task: task });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            msg: "Unable to create task",
        });
    }
}
exports.createTask = createTask;
async function uploadFileCloudinary(req, res) {
    try {
        const user = req.user;
        const task = await task_2.default.findById({ _id: req.params.taskid });
        if (!task) {
            return res.status(404).json({ msg: "No task id found" });
        }
        const file = req.file; //
        if (!req.file) {
            return res.status(400).json({ msg: "no file was uploaded." });
        }
        const response = await (0, cloudinary_1.cloudinaryUpload)(file === null || file === void 0 ? void 0 : file.originalname, file === null || file === void 0 ? void 0 : file.buffer);
        const { projectId } = req.body;
        if (!projectId || !projectModel_1.default.exists(projectId)) {
            return res.status(400).json({
                message: "Unable to upload file, please ensure that you provide a valid project",
            });
        }
        if (!response) {
            throw new Error("Unable to upload file. please try again.");
        }
        //data to keep
        const file_secure_url = response.secure_url;
        //done with processing.
        const newUpload = await file_1.default.create({
            name: file === null || file === void 0 ? void 0 : file.originalname,
            url: file_secure_url,
        });
        task.fileUploads.push(newUpload._id);
        await task.save();
        await activity_1.default.create({
            message: `${user.fullname} uploaded ${file === null || file === void 0 ? void 0 : file.originalname}.`,
            projectId: req.body.projectId,
            createdBy: user._id,
        });
        res.status(200).json({
            msg: "file uploaded successfully.",
            fileUrl: file_secure_url,
        });
    }
    catch (err) {
        return res
            .status(500)
            .json({ msg: "Unable to upload file. please try again." });
    }
}
exports.uploadFileCloudinary = uploadFileCloudinary;
async function getTasksByStatus(req, res) {
    var _a;
    //  const taskStatus = await Task.findById({ status: req.params.status });
    try {
        const getTask = await task_2.default.find({
            projectId: req.params.projectId,
            assignee: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        })
            .populate("comments")
            .populate("owner")
            .populate("assignee")
            .populate("comments.commenter");
        const tasksByStatus = getTask.reduce((acc, task) => {
            if (task.status === "todo") {
                acc.todo.push(task);
            }
            else if (task.status === "backlog") {
                acc.backlog.push(task);
            }
            else {
                acc.done.push(task);
            }
            return acc;
        }, {
            todo: [],
            backlog: [],
            done: [],
        });
        res.status(200).json({ tasks: tasksByStatus });
    }
    catch (err) {
        res.status(500).json("Server Error: please reload and try again");
    }
}
exports.getTasksByStatus = getTasksByStatus;
async function updateTask(req, res) {
    var _a;
    try {
        const taskId = req.params.task;
        const taskSchemaJoi = joi_1.default.object({
            title: joi_1.default.string(),
            description: joi_1.default.string(),
            status: joi_1.default.string(),
            assignee: joi_1.default.string(),
            createdAt: joi_1.default.string(),
            dueDate: joi_1.default.string(),
        });
        const validationResult = taskSchemaJoi.validate(req.body);
        //check for errors
        if (validationResult.error) {
            return res.status(400).json({
                msg: validationResult.error.details[0].message,
            });
        }
        const { title, description, status, assignee, dueDate, createdAt } = req.body;
        const getTask = await task_2.default.findOne({
            $or: [
                { owner: req.user._id, _id: taskId },
                { assignee: req.user._id, _id: taskId },
            ],
        });
        if (!getTask) {
            return res.status(404).json({
                msg: "Task with the title does not exists for that particular user",
            });
        }
        console.log("Task Exist!: ", getTask);
        let updatedTask = await task_2.default.findOneAndUpdate({
            $or: [
                { owner: req.user._id, _id: taskId },
                { assignee: req.user._id, _id: taskId },
            ],
        }, {
            title: title || getTask.title,
            description: description || getTask.description,
            status: status || getTask.status,
            assignee: assignee || getTask.assignee,
            dueDate: dueDate ? new Date(dueDate) : getTask.dueDate,
            createdAt: createdAt ? new Date(createdAt) : getTask.createdAt,
        }, { new: true });
        console.log("updatedTask:", updatedTask);
        let assigneeObj = await user_1.default.findById(req.body.assignee);
        //TODO: only create activity when there is a change in assignee
        if (getTask.assignee.toString() !== assignee && assigneeObj != null) {
            await activity_1.default.create({
                message: `${(_a = req.user) === null || _a === void 0 ? void 0 : _a.fullname} assigned ${assigneeObj.fullname} to perform 
      Task: ${getTask.title}`,
            });
            //create activity
        }
        res.status(201).json({
            status: "success",
            data: updatedTask,
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: "server error: unable to update object.",
        });
    }
}
exports.updateTask = updateTask;
async function getActivity(req, res) {
    const todayDate = new Date();
    console.log("i got here");
    console.log(req.params.projectid);
    const allActivities = await activity_1.default.find({
        projectId: req.params.projectid,
    });
    // console.log(allActivities);
    let activities1 = allActivities.filter(async (activity) => {
        const checkStr = activity.createdAt.toString().split(" ")[1] +
            activity.createdAt.toString().split(" ")[2];
        const checkToday = todayDate.toString().split(" ")[1] + todayDate.toString().split(" ")[2];
        if (checkStr === checkToday) {
            return true;
        }
    });
    console.log("activities1", activities1);
    if (activities1.length === 0) {
        return res.json({ activities1 });
    }
    const activities = activities1.map(async (activity) => {
        console.log(activity.projectId);
        const project = await projectModel_1.default.findById(activity.projectId);
        let { createBy, message, createdAt, projectId, updatedAt, _id } = activity;
        createdAt = new Date(createdAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            hour12: true,
            minute: "2-digit",
        });
        // console.log(createdAt)
        const activityObj = {
            ...{ createdAt, message, _id },
            projectname: project === null || project === void 0 ? void 0 : project.name,
        };
        //  console.log(activityObj)
        return activityObj;
    });
    const todayActivities = await Promise.all(activities);
    console.log(activities);
    res.json({
        status: "i go last",
        todayActivities,
    });
}
exports.getActivity = getActivity;
async function getYesterdayActivity(req, res) {
    const currentDate = new Date();
    try {
        const getAllActivity = await activity_1.default.find({});
        const getActivity = getAllActivity.filter((activity) => {
            const currentActMon = activity.createdAt.toString().split(" ")[1];
            const currActDate = parseInt(activity.createdAt.toString().split(" ")[2]);
            const getDate = currentActMon + " " + currActDate;
            const getCurrMonth = currentDate.toString().split(" ")[1];
            const getCurrDate = parseInt(currentDate.toString().split(" ")[2]) - 1;
            const yesterdayDate = getCurrMonth + " " + getCurrDate;
            if (getDate === yesterdayDate) {
                return true;
            }
        });
        if (getActivity.length === 0) {
            return res.json({ msg: "No activity created previously" });
        }
        res.send(getActivity);
    }
    catch (err) {
        res.status(500).send(err.message);
    }
}
exports.getYesterdayActivity = getYesterdayActivity;
async function allFiles(req, res) {
    try {
        const allFiles = await file_1.default.find();
        if (allFiles.length < 1) {
            return res.status(404).json({ msg: `no file uploaded cleared` });
        }
        res.status(200).json({ files: allFiles });
    }
    catch (err) {
        res.status(400).send(err);
    }
}
exports.allFiles = allFiles;
async function getAllFilesByTask(req, res) {
    const { taskId } = req.params;
    const taskExist = await task_1.default.exists({ _id: taskId });
    try {
        if (!taskExist) {
            return res.status(404).json({
                msg: "Task with the title does not exists for that particular user",
            });
        }
        const requestedTask = await task_1.default.findOne({ _id: taskId });
        const fileUploads = requestedTask === null || requestedTask === void 0 ? void 0 : requestedTask.fileUploads;
        console.log(fileUploads);
        const filesUrl = fileUploads === null || fileUploads === void 0 ? void 0 : fileUploads.map(async (file) => {
            console.log(file, "fileId");
            const fileObj = await file_1.default.findById(file);
            console.log(fileObj, "file");
            return fileObj.url;
        });
        console.log(filesUrl, "file check");
        const arrrayOfUrls = await Promise.all(filesUrl); ///awaited the array of promises to get  the URL's
        return res.status(201).json({
            status: "success",
            data: arrrayOfUrls,
        });
    }
    catch (err) {
        res.status(400).send(err);
    }
}
exports.getAllFilesByTask = getAllFilesByTask;
async function getAllFiles(req, res) {
    const { taskId } = req.params;
    const taskExist = await task_1.default.exists({ _id: taskId });
    try {
        if (!taskExist) {
            return res.status(404).json({
                msg: "Task with the title does not exists for that particular user",
            });
        }
        const requestedTask = await task_1.default.findOne({ _id: taskId });
        const fileUploads = requestedTask === null || requestedTask === void 0 ? void 0 : requestedTask.fileUploads;
        console.log(fileUploads);
        const filesUrl = fileUploads === null || fileUploads === void 0 ? void 0 : fileUploads.map(async (file) => {
            console.log(file, "fileId");
            const fileObj = await file_1.default.findById(file);
            console.log(fileObj.uploadedBy.userId);
            const user = await user_1.default.findById(fileObj.uploadedBy.userId);
            let { uploadedBy, name, fileSize, url, uploadedOn, _id } = fileObj;
            console.log(fileObj, "fileObj");
            uploadedOn = new Date(uploadedOn)
                .toUTCString()
                .split(" ")
                .slice(1, 4)
                .join(" ");
            const viewFile = {
                ...{ uploadedBy, name, fileSize, url, uploadedOn, _id },
                uploadedBy: {
                    fullname: user === null || user === void 0 ? void 0 : user.fullname,
                    profileImage: user === null || user === void 0 ? void 0 : user.profileImage,
                },
            };
            return viewFile;
        });
        console.log(filesUrl, "file check");
        const arrrayOfUrls = await Promise.all(filesUrl); ///awaited the array of promises to get  the URL's
        return res.status(201).json({
            status: "success",
            data: arrrayOfUrls,
        });
    }
    catch (err) {
        res.status(400).send(err);
    }
}
exports.getAllFiles = getAllFiles;
async function getTaskByProjectId(req, res) {
    try {
        const user = req.user;
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(404).json({
                message: "Error, Project not found!.",
            });
        }
        const user_tasks = await task_1.default.find({ owner: user._id });
        res.status(200).json({
            tasks: user_tasks,
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Server Error: Unable to getTask by product Id",
        });
    }
}
exports.getTaskByProjectId = getTaskByProjectId;
async function getAllActivities(req, res) {
    try {
        const activities = await activity_1.default
            .find({ createdBy: req.user._id })
            .sort({ updatedAt: -1 });
        return res.json({
            activities,
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Error getting all activities",
        });
    }
}
exports.getAllActivities = getAllActivities;
