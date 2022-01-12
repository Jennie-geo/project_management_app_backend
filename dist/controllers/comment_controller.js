"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.addComment = void 0;
const activity_1 = __importDefault(require("../models/activity"));
const task_1 = __importDefault(require("../models/task"));
const joi_1 = __importDefault(require("joi"));
const comments_1 = __importDefault(require("../models/comments"));
async function addComment(req, res) {
    var _a, _b;
    const commentSchemaJoi = joi_1.default.object({
        comment: joi_1.default.string().required(),
        projectId: joi_1.default.string().required(),
    });
    try {
        const validationResult = commentSchemaJoi.validate(req.body);
        //check for errors
        if (validationResult.error) {
            return res.status(400).json({
                msg: validationResult.error.details[0].message,
            });
        }
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const task = await task_1.default.findById(req.params.taskid);
        if (!task) {
            return res.status(404).json({
                msg: "You can't add comment to this task. Task does not exist.",
            });
        }
        const newComment = await comments_1.default.create({
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
        await activity_1.default.create({
            message: `${(_b = req.user) === null || _b === void 0 ? void 0 : _b.fullname} commented on the ${task.title} Task`,
            projectId: req.body.projectId,
            createdBy: user_id,
        });
        return res.status(200).json({
            msg: "comment added successfully",
            task: task,
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: "unable to add a comment ,Please try again",
            error: err,
        });
    }
}
exports.addComment = addComment;
async function updateComment(req, res) {
    const CommentId = req.params.commentid;
    const commentSchemaJoi = joi_1.default.object({
        comment: joi_1.default.string(),
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
        const getComment = await comments_1.default.findOne({
            _id: CommentId,
            owner: req.user._id,
        });
        if (!getComment) {
            return res.status(404).json({
                msg: "Comment with the title does not exists for that particular user",
            });
        }
        let updatedComment = await comments_1.default.findOneAndUpdate({ owner: req.user._id }, {
            body: comment ? comment : getComment.comment,
        }, { new: true });
        res.status(200).json({
            status: "success",
            data: updatedComment,
        });
    }
    catch (err) {
        res.status(500).json({
            message: "unable to update , please try again",
            error: err,
        });
    }
}
exports.updateComment = updateComment;
async function deleteComment(req, res) {
    const user = req.user;
    const comment_id = req.params.commentid;
    try {
        if (!(await comments_1.default.exists({
            _id: comment_id,
        }))) {
            return res.status(404).json({
                message: "Comment does not exist!",
            });
        }
        if (!(await comments_1.default.exists({
            _id: comment_id,
            owner: user._id,
        }))) {
            return res.status(403).json({
                message: "You are not authorized to delete this comment.",
            });
        }
        const deletedComment = await comments_1.default.findOneAndDelete({
            _id: comment_id,
            owner: user._id,
        });
        res.status(200).json({
            message: "comment Deleted successfully",
            deletedComment,
        });
    }
    catch (err) {
        res.status(500).json({
            message: "unable to delete , like cause : invalid comment id",
            error: err,
        });
    }
}
exports.deleteComment = deleteComment;
