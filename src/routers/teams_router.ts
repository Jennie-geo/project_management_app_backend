import { Router } from "express";
import {
  createTeam,
  getAllTeamMembers,
  leaveTeam,
  addMemberToTeam,
  updateTeamDetails,
  getUserDetails,
  getAllTeams,
} from "../controllers/teams_controller";
import { authorization } from "../authentication/Auth";

const router = Router();

router.post("/create/:projectId", authorization, createTeam);
router.put("/updateTeamDetails/:id", authorization, updateTeamDetails);
router.post("/addmember/:teamId", authorization, addMemberToTeam);
router.get("/getAllTeamMembers/:teamId", authorization, getAllTeamMembers);
router.get("/leave/:teamId", authorization, leaveTeam);
router.get("/getUserDetails/:teamId", authorization, getUserDetails);
router.get("/all", authorization, getAllTeams);

export default router;
