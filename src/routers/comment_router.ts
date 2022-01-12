import { Router, Request, Response, NextFunction } from "express";
import { authorization } from "../authentication/Auth";
import {
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment_controller";

const router = Router();

router.post("/comment/:taskid", authorization, addComment);
router.put("/update/:commentid", authorization, updateComment);
router.delete("/:commentid", authorization, deleteComment);

export default router;
