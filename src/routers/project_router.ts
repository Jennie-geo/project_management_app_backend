import {
  createInvite,
  createProject,
  updateProject,
  getAllProject,
  getValidCollaborators,
} from "../controllers/projectController";
import { Router } from "express";

import { authorization } from "../authentication/Auth";
const router = Router();

router.post("/invite", authorization, createInvite);
router.post("/create", authorization, createProject);
router.put("/updateproject/:projectId", authorization, updateProject);
router.get("/getproject", authorization, getAllProject);
router.get(
  "/validCollaborators/:projectId",
  authorization,
  getValidCollaborators
);

export default router;
