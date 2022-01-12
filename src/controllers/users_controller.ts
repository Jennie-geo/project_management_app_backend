//user_controller
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import joiUserSchema from "../validations/validate";
import bcrypt from "bcrypt";
import UserModel from "../models/user";
import sendMail from "../utils/nodemailer";
import projectModel from "../models/projectModel";
import { cloudinaryUpload } from "../utils/cloudinary";
import fileModel from "../models/file";
import Joi from "joi";
import { generateJwtToken } from "../utils/generateToken";
import { UserInterface } from "../interfaces/interface";

const secret: string = process.env.JWT_SECRETKEY as string;

export async function createUser(req: Request, res: Response) {
  try {
    const validation = joiUserSchema.validate(req.body);
    if (validation.error) {
      return res.status(400).send(validation.error.details[0].message);
    }
    let { fullname, email, password } = req.body;
    const userObj = await UserModel.findOne({ email: email });
    if (userObj) {
      return res.status(400).send("Email already exist");
    }
    const token = jwt.sign(
      { fullname, email, password },
      process.env.JWT_SECRETKEY as string,
      { expiresIn: process.env.JWT_EMAIL_EXPIRES as string }
    );
    email = email;
    const isDeployed = process.env.NODE_ENV === "production";
    const body = `<h2>Thank you for successfully signing up, click <a href="${
      process.env.HOME_URL
    }${
      isDeployed ? "" : ":" + process.env.PORT
    }/users/acct-activation/${token}">here</a> to activate your account</h2>  `;
    if (process.env.NODE_ENV != "test") {
      sendMail(email, body);
    }
    res
      .status(201)
      .json({ msg: "Email has been sent, kindly activate your account." });
  } catch (err) {
    console.log(err);
    res.status(400).send(`${err}`);
  }
}

export async function activateUserAcct(req: Request, res: Response) {
  try {
    const token = req.params.token;
    if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRETKEY as string,
        async (err: any, decodedToken: any) => {
          if (err) {
            res.status(400).json({ error: "Incorrect or Expired link" });
            return;
          }
          const { fullname, email, password } = decodedToken;
          const checkEmail = await UserModel.findOne({ email });
          if (checkEmail)
            return res
              .status(400)
              .json({ msg: "User with this email already exists" });
          const hashPassword = await bcrypt.hash(password, 10);
          const newUser = new UserModel({
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
        }
      );
    }
  } catch (err) {
    res.status(400).json({ msg: "Something went wrong.." });
  }
}

export function logout(req: Request, res: Response) {
  req.logOut();
  res.json({
    msg: "Logged out successfully.",
  });
}
//fake home page for google
export function loginPage(req: Request, res: Response) {
  res.render("loginPage");
}

export function ssoCallback(req: Request, res: Response) {
  const user = req.user as UserInterface;
  const token = generateJwtToken(user);
  const redirectUrl = process.env.FRONTEND_SSO_REDIRECT as string;
  res.redirect(`${redirectUrl}/${token}`);
}
type customRequest = { user?: any } & Request;
export async function changePassword(req: customRequest, res: Response) {
  const { oldPassword, newPassword, repeatPassword } = req.body;
  //validation of all input fields
  const id = req.user._id;
  try {
    const validUser = await bcrypt.compare(oldPassword, req.user.password);
    if (validUser) {
      if (newPassword === repeatPassword) {
        const newPasswordUpdate = await bcrypt.hash(newPassword, 12);
        const newUserInfo = await UserModel.findByIdAndUpdate(
          { _id: id },
          { password: newPasswordUpdate },
          { new: true }
        );
        res.status(200).json({
          newUserInfo,
        });
        return;
      } else {
        res.status(404).json({
          message: "Password and repeat password does not match",
        });
        return;
      }
    } else {
      res.status(404).json({
        message: "Incorrect password",
      });
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
      message: "Server Error: unable to change password.",
    });
    return;
  }
}
export async function forgetPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email: email });
    if (user) {
      const token = jwt.sign({ id: user._id }, secret, { expiresIn: "30mins" });
      const link = `${process.env.FRONTEND_RESET_PASSWORD}/${token}`;
      const body = `        Dear ${user.fullname},        <p>Follow this <a href=${link}> link </a> to change your password. The link would expire in 30 mins.</P>              `;
      sendMail(email, body);
      res.status(200).json({
        message: "Link sent to your mail.",
        link: link,
      });
    } else {
      res.status(400).json({
        message: "Email not found.",
      });
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "server error, unable to process your request.",
    });
  }
}
export async function verifyResetPassword(req: Request, res: Response) {
  let { token } = req.params;
  const verification = (await jwt.verify(token, secret)) as JwtPayload; ///verification
  const id = verification.id;
  const isValidId = await UserModel.findOne({ _id: id });
  try {
    if (isValidId) {
      return res.render("reset-password", {
        title: "Reset-Password",
        token: token,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "Server Error: unable to verify reset password.",
    });
  }
}
export async function resetPassword(req: Request, res: Response) {
  const { token } = req.params;
  try {
    const verification = (await jwt.verify(token, secret)) as JwtPayload;
    const id = verification.id;
    if (verification) {
      const user = await UserModel.findOne({ _id: id });
      if (user) {
        let { newPassword, repeatPassword } = req.body;
        if (newPassword === repeatPassword) {
          newPassword = await bcrypt.hash(newPassword, 12);
          const updatedUser = await UserModel.findOneAndUpdate(
            { _id: id },
            { password: newPassword },
            { new: true }
          );
          res.status(200).json({
            message: "password updated successfully!",
          });
          return;
        } else {
          res.status(400).json({
            message: "newpassword and repeatpassword don't match",
          });
          return;
        }
      } else {
        res.status(400).json({
          message: "user does not exist",
        });
        return;
      }
    } else {
      res.status(400).json({
        message: "verification error",
      });
      return;
    }
  } catch (err: any) {
    res.status(500).json({
      message: "Server Error, unable to  reset password.",
    });
    return;
  }
}
export async function viewProfile(req: customRequest, res: Response) {
  try {
    const user_id = req.user!._id;
    let viewprofile = await UserModel.findOne({ _id: user_id });
    return res.status(200).json({
      status: "profile details",
      data: viewprofile,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server Error: Unable to view profile",
    });
  }
}

export async function updateProfile(req: customRequest, res: Response) {
  try {
    const user_id = req.user!._id;
    const { fullname, gender, role, location, about, profileImage } = req.body;
    let findProfile = await UserModel.findOne({ _id: user_id });
    if (!findProfile) {
      return res.status(404).json({
        status: "failed",
        message: "User does not exist",
      });
    }
    let updatedProfile = await UserModel.findOneAndUpdate(
      { _id: user_id },
      {
        fullname: fullname,
        gender: gender,
        role: role,
        location: location,
        about: about,
        profileImage: profileImage,
      },
      { new: true }
    );
    res.status(201).json({
      status: "success",
      data: updatedProfile,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server Error: unable to update profile.",
    });
  }
}

export async function uploadFileCloudinary(req: customRequest, res: Response) {
  try {
    const user_id = req.user!._id;
    let findProfile = await UserModel.findOne({ _id: user_id });
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
    const response = await cloudinaryUpload(
      file?.originalname as string,
      file?.buffer as Buffer
    );
    if (!response) {
      return res
        .status(500)
        .json({ msg: "Unable to upload file. please try again." });
    }
    //data to keep
    const file_secure_url = response.secure_url;
    //done with processing.
    const newUpload = await fileModel.create({
      name: file?.originalname,
      url: file_secure_url,
    });

    let updatedProfile = await UserModel.findOneAndUpdate(
      { _id: user_id },
      {
        profileImage: file_secure_url,
      },
      { new: true }
    );

    res.status(200).json({
      msg: "file uploaded successfully.",
      data: updatedProfile,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server Error: unable to upload file to cloudinary",
    });
  }
}

export async function createInviteUser(req: Request, res: Response) {
  try {
    const token = req.params.token;
    //decode the token
    if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRETKEY as string,
        async (err: any, decodedToken: any) => {
          if (err) {
            return res.status(400).json({ error: "Incorrect or Expired link" });
          }
          const { email, projectId, owner } = decodedToken;
          // body validation
          const { password, fullname } = req.body;
          const inviteUserSchema = Joi.object({
            fullname: Joi.string().required().min(6).max(225),
            password: Joi.string().min(3).max(255).required(),
          });

          const inviteUserValidate = inviteUserSchema.validate(req.body);
          if (inviteUserValidate.error) {
            return res.status(400).json({
              message: inviteUserValidate.error.details[0].message,
            });
          }

          //
          const checkEmail = await UserModel.findOne({ email });
          if (checkEmail) {
            return res.status(400).json({
              message: "User with this email already exists",
            });
          }

          const hashPassword = await bcrypt.hash(password, 10);
          const newUser = new UserModel({
            fullname,
            email,
            password: hashPassword,
          });
          const user = await newUser.save();

          const verifyInvite = await projectModel.findOne({
            _id: projectId,
            owner: owner,
          });

          if (verifyInvite) {
            const collab = verifyInvite.collaborators.find(
              (collaborator) => collaborator.email === email
            );
            collab!.isVerified = true;
            await verifyInvite.save();
          }
          return res.status(200).json({
            message: `you have being added to ${verifyInvite?.name} project`,
          });
        }
      );
    } //if
  } catch (err) {
    res.status(500).json({
      msg: "Unable to create account, try again later.",
    });
  }
}

export async function uploadPictureCloudinary(
  req: customRequest,
  res: Response
) {
  try {
    const user_id = req.user!._id;
    let findProfile = await UserModel.findOne({ _id: user_id });
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
    const response = await cloudinaryUpload(
      file?.originalname as string,
      file?.buffer as Buffer
    );
    if (!response) {
      return res
        .status(500)
        .json({ msg: "Unable to upload file. please try again." });
    }
    //data to keep
    const file_secure_url = response.secure_url;
    //done with processing.

    let updatedProfile = await UserModel.findOneAndUpdate(
      { _id: user_id },
      {
        profileImage: file_secure_url,
      },
      { new: true }
    );
    console.log(updatedProfile);
    res.status(200).json({
      msg: "file uploaded successfully.",
      data: updatedProfile,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      msg: "Server Error: unable to complete operation. ",
    });
  }
}
