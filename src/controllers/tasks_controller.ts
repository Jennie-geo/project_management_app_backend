import activityModel from "../models/activity";
import taskModel, { TaskInterface } from "../models/task";
import Task from "../models/task";
import { cloudinaryUpload } from "../utils/cloudinary";
import fileModel from "../models/file";
import express, { Request, Response } from "express";
import Joi from "joi";
import commentModel from "../models/comments";
import UserModel from "../models/user";
import projectModel from "../models/projectModel";
import Team from "../models/teamModel";

interface customRequest extends Request {
  // user: User;
  user?: { _id?: string; email?: string; fullname?: string };
}

export async function getTasks(req: Request, res: Response) {
  const user = req.user as typeof req.user & { _id: string };
  const user_tasks = await taskModel
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

export async function deleteTask(req: Request, res: Response) {
  const user = req.user as typeof req.user & { _id: string };
  const task_id = req.params.id;
  if (
    !(await taskModel.exists({
      _id: task_id,
    }))
  ) {
    return res.status(404).json({
      message: "Task does not exist!",
    });
  }

  if (
    !(await taskModel.exists({
      _id: task_id,
      owner: user._id,
    }))
  ) {
    return res.status(403).json({
      message: "You are not authorized to delete this task.",
    });
  }
  const deletedTask = await taskModel.findOneAndDelete({
    _id: task_id,
    owner: user._id,
  });

  res.status(200).json({
    message: "Deleted successfully",
    deletedTask,
  });
}

export async function createTask(req: customRequest, res: Response) {
  try {
    const taskSchemaJoi = Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      assignee: Joi.string().required(),
      projectId: Joi.string().required(),
      dueDate: Joi.string().required(),
      status: Joi.string().valid("todo", "backlog"),
      tag: Joi.string().required(),
      team: Joi.string().required(),
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
    const getTask = await Task.findOne({
      title: title,
      description: description,
      assignee: assignee,
    });
    const assigneeUser = await UserModel.findById(assignee);

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

    const task = new Task({
      ...req.body,
      owner: req.user!._id,
    });

    await task.save();

    const teamFromDb = await Team.findById({ _id: req.body.team });
    if (teamFromDb && UserModel.exists({ _id: req.body.assignee })) {
      teamFromDb.members.push({
        user: req.body.assignee,
        role: req.body.role || "developer",
      });
      await teamFromDb.save();
    }

    const assigner = req.user?.fullname;
    await activityModel.create({
      message: `${assigner} assigned ${
        assigneeUser!.fullname
      } to perform Task: ${task.title} task`,
      projectId,
      createdBy: req.user!._id,
    });

    return res
      .status(201)
      .json({ msg: "Task created successfully", Task: task });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      msg: "Unable to create task",
    });
  }
}

export async function uploadFileCloudinary(req: Request, res: Response) {
  try {
    const user = req.user as typeof req.user & {
      fullname: string;
      _id: string;
    };
    const task = await Task.findById({ _id: req.params.taskid });
    if (!task) {
      return res.status(404).json({ msg: "No task id found" });
    }
    const file = req.file; //
    if (!req.file) {
      return res.status(400).json({ msg: "no file was uploaded." });
    }
    const response = await cloudinaryUpload(
      file?.originalname as string,
      file?.buffer as Buffer
    );

    const { projectId } = req.body;
    if (!projectId || !projectModel.exists(projectId)) {
      return res.status(400).json({
        message:
          "Unable to upload file, please ensure that you provide a valid project",
      });
    }

    if (!response) {
      throw new Error("Unable to upload file. please try again.");
    }
    //data to keep
    const file_secure_url = response.secure_url;
    //done with processing.
    const newUpload = await fileModel.create({
      name: file?.originalname,
      url: file_secure_url,
    });
    task.fileUploads.push(newUpload._id);
    await task.save();
    await activityModel.create({
      message: `${user!.fullname} uploaded ${file?.originalname}.`,
      projectId: req.body.projectId,
      createdBy: user._id,
    });
    res.status(200).json({
      msg: "file uploaded successfully.",
      fileUrl: file_secure_url,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ msg: "Unable to upload file. please try again." });
  }
}

export async function getTasksByStatus(req: customRequest, res: Response) {
  //  const taskStatus = await Task.findById({ status: req.params.status });
  try {
    const getTask = await Task.find({
      projectId: req.params.projectId,
      assignee: req.user?._id,
    })
      .populate("comments")
      .populate("owner")
      .populate("assignee")
      .populate("comments.commenter");

    const tasksByStatus = getTask.reduce(
      (acc, task) => {
        if (task.status === "todo") {
          acc.todo.push(task);
        } else if (task.status === "backlog") {
          acc.backlog.push(task);
        } else {
          acc.done.push(task);
        }
        return acc;
      },
      {
        todo: [] as TaskInterface[],
        backlog: [] as TaskInterface[],
        done: [] as TaskInterface[],
      }
    );

    res.status(200).json({ tasks: tasksByStatus });
  } catch (err) {
    res.status(500).json("Server Error: please reload and try again");
  }
}

export async function updateTask(req: customRequest, res: Response) {
  try {
    const taskId = req.params.task;
    const taskSchemaJoi = Joi.object({
      title: Joi.string(),
      description: Joi.string(),
      status: Joi.string(),
      assignee: Joi.string(),
      createdAt: Joi.string(),
      dueDate: Joi.string(),
    });

    const validationResult = taskSchemaJoi.validate(req.body);
    //check for errors
    if (validationResult.error) {
      return res.status(400).json({
        msg: validationResult.error.details[0].message,
      });
    }
    const { title, description, status, assignee, dueDate, createdAt } =
      req.body;
    const getTask = await Task.findOne({
      $or: [
        { owner: req.user!._id, _id: taskId },
        { assignee: req.user!._id, _id: taskId },
      ],
    });

    if (!getTask) {
      return res.status(404).json({
        msg: "Task with the title does not exists for that particular user",
      });
    }

    console.log("Task Exist!: ", getTask);

    let updatedTask = await Task.findOneAndUpdate(
      {
        $or: [
          { owner: req.user!._id, _id: taskId },
          { assignee: req.user!._id, _id: taskId },
        ],
      },
      {
        title: title || getTask.title,
        description: description || getTask.description,
        status: status || getTask.status,
        assignee: assignee || getTask.assignee,
        dueDate: dueDate ? new Date(dueDate) : getTask.dueDate,
        createdAt: createdAt ? new Date(createdAt) : getTask.createdAt,
      },
      { new: true }
    );

    console.log("updatedTask:", updatedTask);
    let assigneeObj = await UserModel.findById(req.body.assignee);

    //TODO: only create activity when there is a change in assignee

    if (getTask.assignee.toString() !== assignee && assigneeObj != null) {
      await activityModel.create({
        message: `${req.user?.fullname} assigned ${
          assigneeObj!.fullname
        } to perform 
      Task: ${getTask.title}`,
      });

      //create activity
    }

    res.status(201).json({
      status: "success",
      data: updatedTask,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "server error: unable to update object.",
    });
  }
}

export async function getActivity(req: express.Request, res: express.Response) {
  const todayDate = new Date();
  console.log("i got here");
  console.log(req.params.projectid);
  const allActivities = await activityModel.find({
    projectId: req.params.projectid,
  });
  // console.log(allActivities);
  let activities1 = allActivities.filter(async (activity) => {
    const checkStr =
      activity.createdAt.toString().split(" ")[1] +
      activity.createdAt.toString().split(" ")[2];
    const checkToday =
      todayDate.toString().split(" ")[1] + todayDate.toString().split(" ")[2];
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
    const project = await projectModel.findById(activity.projectId);
    let { createBy, message, createdAt, projectId, updatedAt, _id } = activity;
    createdAt = new Date(createdAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
      minute: "2-digit",
    });
    // console.log(createdAt)
    const activityObj = {
      ...{ createdAt, message, _id },
      projectname: project?.name,
    };
    //  console.log(activityObj)
    return activityObj;
  }) as Promise<any>[];
  const todayActivities = await Promise.all(activities);
  console.log(activities);
  res.json({
    status: "i go last",
    todayActivities,
  });
}
export async function getYesterdayActivity(
  req: express.Request,
  res: express.Response
) {
  const currentDate = new Date();
  try {
    const getAllActivity = await activityModel.find({});

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
  } catch (err: any) {
    res.status(500).send(err.message);
  }
}

export async function allFiles(req: customRequest, res: Response) {
  try {
    const allFiles = await fileModel.find();
    if (allFiles.length < 1) {
      return res.status(404).json({ msg: `no file uploaded cleared` });
    }
    res.status(200).json({ files: allFiles });
  } catch (err) {
    res.status(400).send(err);
  }
}

export async function getAllFilesByTask(req: customRequest, res: Response) {
  const { taskId } = req.params;
  const taskExist = await taskModel.exists({ _id: taskId });
  try {
    if (!taskExist) {
      return res.status(404).json({
        msg: "Task with the title does not exists for that particular user",
      });
    }
    const requestedTask = await taskModel.findOne({ _id: taskId });
    const fileUploads = requestedTask?.fileUploads;
    console.log(fileUploads);
    const filesUrl = fileUploads?.map(async (file: String) => {
      console.log(file, "fileId");
      const fileObj = await fileModel.findById(file);
      console.log(fileObj, "file");
      return fileObj.url;
    }) as Promise<string>[];
    console.log(filesUrl, "file check");
    const arrrayOfUrls = await Promise.all(filesUrl); ///awaited the array of promises to get  the URL's
    return res.status(201).json({
      status: "success",
      data: arrrayOfUrls,
    });
  } catch (err) {
    res.status(400).send(err);
  }
}
export async function getAllFiles(req: customRequest, res: Response) {
  const { taskId } = req.params;
  const taskExist = await taskModel.exists({ _id: taskId });
  try {
    if (!taskExist) {
      return res.status(404).json({
        msg: "Task with the title does not exists for that particular user",
      });
    }
    const requestedTask = await taskModel.findOne({ _id: taskId });
    const fileUploads = requestedTask?.fileUploads;
    console.log(fileUploads);
    const filesUrl = fileUploads?.map(async (file: any) => {
      console.log(file, "fileId");
      const fileObj = await fileModel.findById(file);
      console.log(fileObj.uploadedBy.userId);
      const user = await UserModel.findById(fileObj.uploadedBy.userId);
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
          fullname: user?.fullname,
          profileImage: user?.profileImage,
        },
      };
      return viewFile;
    }) as Promise<any>[];
    console.log(filesUrl, "file check");
    const arrrayOfUrls = await Promise.all(filesUrl); ///awaited the array of promises to get  the URL's
    return res.status(201).json({
      status: "success",
      data: arrrayOfUrls,
    });
  } catch (err) {
    res.status(400).send(err);
  }
}

export async function getTaskByProjectId(req: Request, res: Response) {
  try {
    const user = req.user as typeof req.user & { _id: string };
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(404).json({
        message: "Error, Project not found!.",
      });
    }
    const user_tasks = await taskModel.find({ owner: user!._id });
    res.status(200).json({
      tasks: user_tasks,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server Error: Unable to getTask by product Id",
    });
  }
}

export async function getAllActivities(req: customRequest, res: Response) {
  try {
    const activities = await activityModel
      .find({ createdBy: req.user!._id })
      .sort({ updatedAt: -1 });
    return res.json({
      activities,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error getting all activities",
    });
  }
}
