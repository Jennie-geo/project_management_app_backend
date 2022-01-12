import { Router, Request, Response, NextFunction } from "express";
import { authorization } from "../authentication/Auth";
import {
  createTask,
  deleteTask,
  uploadFileCloudinary,
  getTasksByStatus,
  getTasks,
  updateTask,
  getActivity,
  getYesterdayActivity,
  getAllFilesByTask,
  allFiles,
  getAllFiles,
  getTaskByProjectId,
  getAllActivities,
} from "../controllers/tasks_controller";

const router = Router();

router.get("/", authorization, getTasks);
router.delete("/:id", authorization, deleteTask);
router.post("/create", authorization, createTask);
router.get("/getTasks/:projectId/:status", authorization, getTasksByStatus);
router.post("/upload/:taskid", authorization, uploadFileCloudinary);
router.post("/update/:task", authorization, updateTask);
router.get("/activity/:projectid", authorization, getActivity);
router.get("/yesterActivities", authorization, getYesterdayActivity);
router.get("/getFiles/:taskId", authorization, getAllFilesByTask);
router.get("/allfiles", authorization, allFiles);
router.get("/allFiles/:taskId", authorization, getAllFiles);
router.get("/projectId", authorization, getTaskByProjectId);
router.get("/allactivity/", authorization, getAllActivities);

export default router;
