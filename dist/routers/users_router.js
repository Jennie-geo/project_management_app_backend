"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_controller_1 = require("../controllers/users_controller");
const express_1 = require("express");
const Auth_1 = require("../authentication/Auth");
const passportStrategies_1 = __importDefault(require("../authentication/passportStrategies"));
const generateToken_1 = require("../utils/generateToken");
const router = (0, express_1.Router)();
// Welcome Page
router.get("/welcome", Auth_1.authorization, (req, res) => {
    const user = req.user;
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
    passportStrategies_1.default.authenticate("local", (err, user, info) => {
        if (!user) {
            return res.status(401).json({
                msg: "Invalid user name or password.",
            });
        }
        //create token
        const token = (0, generateToken_1.generateJwtToken)(user);
        res.status(200).json({
            msg: `welcome ${user.fullname}`,
            token,
        });
    })(req, res, next);
});
router.get("/logout", Auth_1.authorization, users_controller_1.logout);
router.get("/loginfail", function (req, res, next) {
    let msg = req.flash("error")[0];
    console.log("login fail: ", msg);
    res.status(403).json({
        msg: "invalid email or password",
    });
});
//google
router.get("/google", passportStrategies_1.default.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/redirect", passportStrategies_1.default.authenticate("google"), users_controller_1.ssoCallback);
router.get("/auth/facebook", passportStrategies_1.default.authenticate("facebook", {
    scope: ["public_profile", "email"],
}));
router.get("/auth/facebook/callback", passportStrategies_1.default.authenticate("facebook"), users_controller_1.ssoCallback);
router.get("/loginPage", users_controller_1.loginPage);
router.post("/signup", users_controller_1.createUser);
router.get("/profile", Auth_1.authorization, users_controller_1.viewProfile);
router.put("/profile", Auth_1.authorization, users_controller_1.updateProfile);
router.get("/acct-activation/:token", users_controller_1.activateUserAcct);
router.post("/password/changepassword", Auth_1.authorization, users_controller_1.changePassword);
router.post("/password/forgetPassword", users_controller_1.forgetPassword);
router.get("/password/resetPassword/:token", users_controller_1.verifyResetPassword);
router.post("/password/resetPassword/:token", users_controller_1.resetPassword);
router.post("/inviteUser/:token", users_controller_1.createInviteUser);
router.post("/upload/:projectId", Auth_1.authorization, users_controller_1.uploadFileCloudinary);
router.post("/uploadProfile", Auth_1.authorization, users_controller_1.uploadPictureCloudinary);
//googlesso, fbsso, profile, changepassword,
exports.default = router;
