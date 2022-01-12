"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = __importDefault(require("passport-google-oauth20"));
const passport_facebook_1 = __importDefault(require("passport-facebook"));
const user_1 = __importDefault(require("../models/user"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const passport_local_1 = require("passport-local");
const GoogleStrategy = passport_google_oauth20_1.default.Strategy;
const FacebookStrategy = passport_facebook_1.default.Strategy;
dotenv_1.default.config();
passport_1.default.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ["id", "displayName", "email"],
}, async function (accessToken, refreshToken, profile, done) {
    const currentUser = await user_1.default
        .findOne({
        facebookId: profile.id,
    })
        .exec();
    //TODO ovie refactor this code!
    if (!currentUser) {
        const newUser = await user_1.default.create({
            facebookId: profile.id,
            fullname: profile.displayName,
            email: profile._json.email,
            password: bcrypt_1.default.hashSync(profile.id, 12),
        });
        return done(null, newUser);
    }
    return done(null, currentUser);
}));
const callbackURL = process.env.NODE_ENV == "production"
    ? `${process.env.HOME_URL}/users/google/redirect/`
    : `${process.env.HOME_URL}:${process.env.PORT}/users/google/redirect`;
passport_1.default.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL,
}, async function (accessToken, refreshToken, profile, done) {
    const currentUser = await user_1.default
        .findOne({ googleId: profile.id })
        .exec();
    console.log("google strategy currentUser:", currentUser);
    if (!currentUser) {
        // console.log("google strategy new : ", currentUser);
        const newUser = await user_1.default.create({
            googleId: profile.id,
            fullname: profile.displayName,
            email: profile.emails[0]["value"],
            password: bcrypt_1.default.hashSync(profile.id, 12),
        });
        return done(null, newUser);
    }
    return done(null, currentUser);
}));
passport_1.default.use(new passport_local_1.Strategy({ usernameField: "email" }, async (email, password, done) => {
    //Vetting a user
    try {
        let user = await user_1.default.findOne({ email: email });
        if (!user) {
            return done(null, false, {
                message: " This email  does not exit ",
            });
        }
        const passwordMatch = bcrypt_1.default.compareSync(password, user.password);
        if (!passwordMatch) {
            return done(null, false, { message: "User password is incorrect" });
        }
        else {
            return done(null, user);
        }
    }
    catch (err) {
        console.log(err);
    }
}));
passport_1.default.serializeUser((user, done) => {
    //stores a cookie in the browser with the user id inside it
    console.log("serializeUser called, loggedIn user:", user);
    done(null, user._id);
});
passport_1.default.deserializeUser((id, done) => {
    console.log("deserialize user called.");
    user_1.default.findById(id, function (err, user) {
        done(err, user);
    });
});
exports.default = passport_1.default;
