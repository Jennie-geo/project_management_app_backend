"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPictureCloudinary = exports.createInviteUser = exports.uploadFileCloudinary = exports.updateProfile = exports.viewProfile = exports.resetPassword = exports.verifyResetPassword = exports.forgetPassword = exports.changePassword = exports.ssoCallback = exports.loginPage = exports.logout = exports.activateUserAcct = exports.createUser = void 0;
//user_controller
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validate_1 = __importDefault(require("../validations/validate"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_1 = __importDefault(require("../models/user"));
const nodemailer_1 = __importDefault(require("../utils/nodemailer"));
const projectModel_1 = __importDefault(require("../models/projectModel"));
const cloudinary_1 = require("../utils/cloudinary");
const file_1 = __importDefault(require("../models/file"));
const joi_1 = __importDefault(require("joi"));
const generateToken_1 = require("../utils/generateToken");
const secret = process.env.JWT_SECRETKEY;
async function createUser(req, res) {
    try {
        const validation = validate_1.default.validate(req.body);
        if (validation.error) {
            return res.status(400).send(validation.error.details[0].message);
        }
        let { fullname, email, password } = req.body;
        const userObj = await user_1.default.findOne({ email: email });
        if (userObj) {
            return res.status(400).send("Email already exist");
        }
        const token = jsonwebtoken_1.default.sign({ fullname, email, password }, process.env.JWT_SECRETKEY, { expiresIn: process.env.JWT_EMAIL_EXPIRES });
        email = email;
        const isDeployed = process.env.NODE_ENV === "production";
        const body = `<h2>Thank you for successfully signing up, click <a href="${process.env.HOME_URL}${isDeployed ? "" : ":" + process.env.PORT}/users/acct-activation/${token}">here</a> to activate your account</h2>  `;
        if (process.env.NODE_ENV != "test") {
            (0, nodemailer_1.default)(email, body);
        }
        res
            .status(201)
            .json({ msg: "Email has been sent, kindly activate your account." });
    }
    catch (err) {
        console.log(err);
        res.status(400).send(`${err}`);
    }
}
exports.createUser = createUser;
async function activateUserAcct(req, res) {
    try {
        const token = req.params.token;
        if (token) {
            jsonwebtoken_1.default.verify(token, process.env.JWT_SECRETKEY, async (err, decodedToken) => {
                if (err) {
                    res.status(400).json({ error: "Incorrect or Expired link" });
                    return;
                }
                const { fullname, email, password } = decodedToken;
                const checkEmail = await user_1.default.findOne({ email });
                if (checkEmail)
                    return res
                        .status(400)
                        .json({ msg: "User with this email already exists" });
                const hashPassword = await bcrypt_1.default.hash(password, 10);
                const newUser = new user_1.default({
                    fullname,
                    email,
                    password: hashPassword,
                });
                const user = await newUser.save();
                if (user) {
                    return res.status(201).json({ msg: "New User created", user });
                }
                res
                    .status(400)
                    .json({ success: false, msg: "Unable to activate user account" });
            });
        }
    }
    catch (err) {
        res.status(400).json({ msg: "Something went wrong.." });
    }
}
exports.activateUserAcct = activateUserAcct;
function logout(req, res) {
    req.logOut();
    res.json({
        msg: "Logged out successfully.",
    });
}
exports.logout = logout;
//fake home page for google
function loginPage(req, res) {
    res.render("loginPage");
}
exports.loginPage = loginPage;
function ssoCallback(req, res) {
    const user = req.user;
    const token = (0, generateToken_1.generateJwtToken)(user);
    const redirectUrl = process.env.FRONTEND_SSO_REDIRECT;
    res.redirect(`${redirectUrl}/${token}`);
}
exports.ssoCallback = ssoCallback;
async function changePassword(req, res) {
    const { oldPassword, newPassword, repeatPassword } = req.body;
    //validation of all input fields
    const id = req.user._id;
    try {
        const validUser = await bcrypt_1.default.compare(oldPassword, req.user.password);
        if (validUser) {
            if (newPassword === repeatPassword) {
                const newPasswordUpdate = await bcrypt_1.default.hash(newPassword, 12);
                const newUserInfo = await user_1.default.findByIdAndUpdate({ _id: id }, { password: newPasswordUpdate }, { new: true });
                res.status(200).json({
                    newUserInfo,
                });
                return;
            }
            else {
                res.status(404).json({
                    message: "Password and repeat password does not match",
                });
                return;
            }
        }
        else {
            res.status(404).json({
                message: "Incorrect password",
            });
            return;
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: err,
            message: "Server Error: unable to change password.",
        });
        return;
    }
}
exports.changePassword = changePassword;
async function forgetPassword(req, res) {
    try {
        const { email } = req.body;
        const user = await user_1.default.findOne({ email: email });
        if (user) {
            const token = jsonwebtoken_1.default.sign({ id: user._id }, secret, { expiresIn: "30mins" });
            const link = `${process.env.FRONTEND_RESET_PASSWORD}/${token}`;
            const body = `        Dear ${user.fullname},        <p>Follow this <a href=${link}> link </a> to change your password. The link would expire in 30 mins.</P>              `;
            (0, nodemailer_1.default)(email, body);
            res.status(200).json({
                message: "Link sent to your mail.",
                link: link,
            });
        }
        else {
            res.status(400).json({
                message: "Email not found.",
            });
            return;
        }
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: "server error, unable to process your request.",
        });
    }
}
exports.forgetPassword = forgetPassword;
async function verifyResetPassword(req, res) {
    let { token } = req.params;
    const verification = (await jsonwebtoken_1.default.verify(token, secret)); ///verification
    const id = verification.id;
    const isValidId = await user_1.default.findOne({ _id: id });
    try {
        if (isValidId) {
            return res.render("reset-password", {
                title: "Reset-Password",
                token: token,
            });
        }
    }
    catch (err) {
        res.status(500).json({
            message: "Server Error: unable to verify reset password.",
        });
    }
}
exports.verifyResetPassword = verifyResetPassword;
async function resetPassword(req, res) {
    const { token } = req.params;
    try {
        const verification = (await jsonwebtoken_1.default.verify(token, secret));
        const id = verification.id;
        if (verification) {
            const user = await user_1.default.findOne({ _id: id });
            if (user) {
                let { newPassword, repeatPassword } = req.body;
                if (newPassword === repeatPassword) {
                    newPassword = await bcrypt_1.default.hash(newPassword, 12);
                    const updatedUser = await user_1.default.findOneAndUpdate({ _id: id }, { password: newPassword }, { new: true });
                    res.status(200).json({
                        message: "password updated successfully!",
                    });
                    return;
                }
                else {
                    res.status(400).json({
                        message: "newpassword and repeatpassword don't match",
                    });
                    return;
                }
            }
            else {
                res.status(400).json({
                    message: "user does not exist",
                });
                return;
            }
        }
        else {
            res.status(400).json({
                message: "verification error",
            });
            return;
        }
    }
    catch (err) {
        res.status(500).json({
            message: "Server Error, unable to  reset password.",
        });
        return;
    }
}
exports.resetPassword = resetPassword;
async function viewProfile(req, res) {
    try {
        const user_id = req.user._id;
        let viewprofile = await user_1.default.findOne({ _id: user_id });
        return res.status(200).json({
            status: "profile details",
            data: viewprofile,
        });
    }
    catch (err) {
        res.status(500).json({
            msg: "Server Error: Unable to view profile",
        });
    }
}
exports.viewProfile = viewProfile;
async function updateProfile(req, res) {
    try {
        const user_id = req.user._id;
        const { fullname, gender, role, location, about, profileImage } = req.body;
        let findProfile = await user_1.default.findOne({ _id: user_id });
        if (!findProfile) {
            return res.status(404).json({
                status: "failed",
                message: "User does not exist",
            });
        }
        let updatedProfile = await user_1.default.findOneAndUpdate({ _id: user_id }, {
            fullname: fullname,
            gender: gender,
            role: role,
            location: location,
            about: about,
            profileImage: profileImage,
        }, { new: true });
        res.status(201).json({
            status: "success",
            data: updatedProfile,
        });
    }
    catch (err) {
        res.status(500).json({
            msg: "Server Error: unable to update profile.",
        });
    }
}
exports.updateProfile = updateProfile;
async function uploadFileCloudinary(req, res) {
    try {
        const user_id = req.user._id;
        let findProfile = await user_1.default.findOne({ _id: user_id });
        if (!findProfile) {
            return res.status(404).json({
                status: "failed",
                message: "User does not exist",
            });
        }
        const file = req.file;
        if (!req.file) {
            return res.status(400).json({ msg: "no file was uploaded." });
        }
        const response = await (0, cloudinary_1.cloudinaryUpload)(file === null || file === void 0 ? void 0 : file.originalname, file === null || file === void 0 ? void 0 : file.buffer);
        if (!response) {
            return res
                .status(500)
                .json({ msg: "Unable to upload file. please try again." });
        }
        //data to keep
        const file_secure_url = response.secure_url;
        //done with processing.
        const newUpload = await file_1.default.create({
            name: file === null || file === void 0 ? void 0 : file.originalname,
            url: file_secure_url,
        });
        let updatedProfile = await user_1.default.findOneAndUpdate({ _id: user_id }, {
            profileImage: file_secure_url,
        }, { new: true });
        res.status(200).json({
            msg: "file uploaded successfully.",
            data: updatedProfile,
        });
    }
    catch (err) {
        res.status(500).json({
            msg: "Server Error: unable to upload file to cloudinary",
        });
    }
}
exports.uploadFileCloudinary = uploadFileCloudinary;
async function createInviteUser(req, res) {
    try {
        const token = req.params.token;
        //decode the token
        if (token) {
            jsonwebtoken_1.default.verify(token, process.env.JWT_SECRETKEY, async (err, decodedToken) => {
                if (err) {
                    return res.status(400).json({ error: "Incorrect or Expired link" });
                }
                const { email, projectId, owner } = decodedToken;
                // body validation
                const { password, fullname } = req.body;
                const inviteUserSchema = joi_1.default.object({
                    fullname: joi_1.default.string().required().min(6).max(225),
                    password: joi_1.default.string().min(3).max(255).required(),
                });
                const inviteUserValidate = inviteUserSchema.validate(req.body);
                if (inviteUserValidate.error) {
                    return res.status(400).json({
                        message: inviteUserValidate.error.details[0].message,
                    });
                }
                //
                const checkEmail = await user_1.default.findOne({ email });
                if (checkEmail) {
                    return res.status(400).json({
                        message: "User with this email already exists",
                    });
                }
                const hashPassword = await bcrypt_1.default.hash(password, 10);
                const newUser = new user_1.default({
                    fullname,
                    email,
                    password: hashPassword,
                });
                const user = await newUser.save();
                const verifyInvite = await projectModel_1.default.findOne({
                    _id: projectId,
                    owner: owner,
                });
                if (verifyInvite) {
                    const collab = verifyInvite.collaborators.find((collaborator) => collaborator.email === email);
                    collab.isVerified = true;
                    await verifyInvite.save();
                }
                return res.status(200).json({
                    message: `you have being added to ${verifyInvite === null || verifyInvite === void 0 ? void 0 : verifyInvite.name} project`,
                });
            });
        } //if
    }
    catch (err) {
        res.status(500).json({
            msg: "Unable to create account, try again later.",
        });
    }
}
exports.createInviteUser = createInviteUser;
async function uploadPictureCloudinary(req, res) {
    try {
        const user_id = req.user._id;
        let findProfile = await user_1.default.findOne({ _id: user_id });
        if (!findProfile) {
            return res.status(404).json({
                status: "failed",
                message: "User does not exist",
            });
        }
        const file = req.file;
        if (!req.file) {
            return res.status(400).json({ msg: "no file was uploaded." });
        }
        const response = await (0, cloudinary_1.cloudinaryUpload)(file === null || file === void 0 ? void 0 : file.originalname, file === null || file === void 0 ? void 0 : file.buffer);
        if (!response) {
            return res
                .status(500)
                .json({ msg: "Unable to upload file. please try again." });
        }
        //data to keep
        const file_secure_url = response.secure_url;
        //done with processing.
        let updatedProfile = await user_1.default.findOneAndUpdate({ _id: user_id }, {
            profileImage: file_secure_url,
        }, { new: true });
        console.log(updatedProfile);
        res.status(200).json({
            msg: "file uploaded successfully.",
            data: updatedProfile,
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            msg: "Server Error: unable to complete operation. ",
        });
    }
}
exports.uploadPictureCloudinary = uploadPictureCloudinary;
