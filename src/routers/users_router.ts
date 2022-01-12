import {
  createUser,
  activateUserAcct,
  logout,
  loginPage,
  ssoCallback,
  changePassword,
  resetPassword,
  verifyResetPassword,
  forgetPassword,
  viewProfile,
  updateProfile,
  createInviteUser,
  uploadFileCloudinary,
  uploadPictureCloudinary,
} from "../controllers/users_controller";
import { Router, Request, Response, NextFunction } from "express";
import { authorization } from "../authentication/Auth";
import passport from "../authentication/passportStrategies";
import { generateJwtToken } from "../utils/generateToken";

const router = Router();

interface customUser {
  fullname?: string;
}

// Welcome Page
router.get("/welcome", authorization, (req, res) => {
  const user = req.user as customUser;
  res.json({ msg: `welcome ${user.fullname}` });
});

router.post("/login", (req, res, next) => {
  // res.setHeader("Access-Control-Allow-Origin", "http://localhost:3001");
  //err,user,info
  // passport.authenticate("local", {
  //   successRedirect: "/users/welcome",
  //   failureRedirect: "/users/loginfail",
  //   failureFlash: true,
  // })(req, res, next);
  passport.authenticate("local", (err, user, info) => {
    if (!user) {
      return res.status(401).json({
        msg: "Invalid user name or password.",
      });
    }

    //create token
    const token = generateJwtToken(user);
    res.status(200).json({
      msg: `welcome ${user.fullname}`,
      token,
    });
  })(req, res, next);
});

router.get("/logout", authorization, logout);

router.get(
  "/loginfail",
  function (req: Request, res: Response, next: NextFunction) {
    let msg = req.flash("error")[0];
    console.log("login fail: ", msg);
    res.status(403).json({
      msg: "invalid email or password",
    });
  }
);

//google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/redirect", passport.authenticate("google"), ssoCallback);

router.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    scope: ["public_profile", "email"],
  })
);

router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook"),
  ssoCallback
);
router.get("/loginPage", loginPage);
router.post("/signup", createUser);
router.get("/profile", authorization, viewProfile);
router.put("/profile", authorization, updateProfile);
router.get("/acct-activation/:token", activateUserAcct);
router.post("/password/changepassword", authorization, changePassword);
router.post("/password/forgetPassword", forgetPassword);
router.get("/password/resetPassword/:token", verifyResetPassword);
router.post("/password/resetPassword/:token", resetPassword);
router.post("/inviteUser/:token", createInviteUser);
router.post("/upload/:projectId", authorization, uploadFileCloudinary);
router.post("/uploadProfile", authorization, uploadPictureCloudinary);

//googlesso, fbsso, profile, changepassword,
export default router;
