import activityModel from "../models/activity";
import taskModel from "../models/task";
import Task from "../models/task";
import express, { Request, Response } from "express";
import Joi from "joi";
import commentModel from "../models/comments";

interface userInterface extends Request {
  // user: User;
  user?: { _id?: string; email?: string; fullname?: string };
}
type customRequest = Request & {
  user?: { _id?: string; email?: string; fullname?: string };
};

export async function addComment(req: customRequest, res: Response) {
  const commentSchemaJoi = Joi.object({
    comment: Joi.string().required(),
    projectId: Joi.string().required(),
  });
  try {
    const validationResult = commentSchemaJoi.validate(req.body);
    //check for errors
    if (validationResult.error) {
      return res.status(400).json({
        msg: validationResult.error.details[0].message,
      });
    }
    const user_id = req.user?._id;
    const task = await taskModel.findById(req.params.taskid);

    if (!task) {
      return res.status(404).json({
        msg: "You can't add comment to this task. Task does not exist.",
      });
    }
    const newComment = await commentModel.create({
      body: req.body.comment,
      commenter: user_id,
    });

    //add comment to task
    task.comments.push(newComment._id);
    task.save();

    await task.populate("comments");
    await task.populate("team");
    await task.populate("assignee");
    await task.populate("comments.commenter");
    await task.populate("owner");
    //add activity for comment`
    await activityModel.create({
      message: `${req.user?.fullname} commented on the ${task.title} Task`,
      projectId: req.body.projectId,
      createdBy: user_id,
    });

    return res.status(200).json({
      msg: "comment added successfully",
      task: task,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "unable to add a comment ,Please try again",
      error: err,
    });
  }
}

export async function updateComment(req: userInterface, res: Response) {
  const CommentId = req.params.commentid;
  const commentSchemaJoi = Joi.object({
    comment: Joi.string(),
  });

  try {
    const validationResult = commentSchemaJoi.validate(req.body);
    //check for errors
    if (validationResult.error) {
      return res.status(400).json({
        msg: validationResult.error.details[0].message,
      });
    }
    const { comment } = req.body;
    const getComment = await commentModel.findOne({
      _id: CommentId,
      owner: req.user!._id,
    });

    if (!getComment) {
      return res.status(404).json({
        msg: "Comment with the title does not exists for that particular user",
      });
    }

    let updatedComment = await commentModel.findOneAndUpdate(
      { owner: req.user!._id },
      {
        body: comment ? comment : getComment.comment,
      },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      data: updatedComment,
    });
  } catch (err) {
    res.status(500).json({
      message: "unable to update , please try again",
      error: err,
    });
  }
}

export async function deleteComment(req: Request, res: Response) {
  const user = req.user as typeof req.user & { _id: string };
  const comment_id = req.params.commentid;

  try {
    if (
      !(await commentModel.exists({
        _id: comment_id,
      }))
    ) {
      return res.status(404).json({
        message: "Comment does not exist!",
      });
    }

    if (
      !(await commentModel.exists({
        _id: comment_id,
        owner: user._id,
      }))
    ) {
      return res.status(403).json({
        message: "You are not authorized to delete this comment.",
      });
    }
    const deletedComment = await commentModel.findOneAndDelete({
      _id: comment_id,
      owner: user._id,
    });

    res.status(200).json({
      message: "comment Deleted successfully",
      deletedComment,
    });
  } catch (err) {
    res.status(500).json({
      message: "unable to delete , like cause : invalid comment id",
      error: err,
    });
  }
}
