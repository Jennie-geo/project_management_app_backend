import dotenv from "dotenv";
import passport from "passport";
import passportGoogleOauth from "passport-google-oauth20";
import passportfacebook from "passport-facebook";
import userModel from "../models/user";
import bcrypt from "bcrypt";
import { Strategy as localStrategy } from "passport-local";

const GoogleStrategy = passportGoogleOauth.Strategy;
const FacebookStrategy = passportfacebook.Strategy;

dotenv.config();
type customUser = { _id?: string } & Express.User;

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL as string,
      profileFields: ["id", "displayName", "email"],
    },
    async function (accessToken, refreshToken, profile, done) {
      const currentUser = await userModel
        .findOne({
          facebookId: profile.id,
        })
        .exec();
      //TODO ovie refactor this code!
      if (!currentUser) {
        const newUser = await userModel.create({
          facebookId: profile.id,
          fullname: profile.displayName,
          email: profile._json.email,
          password: bcrypt.hashSync(profile.id, 12),
        });
        return done(null, newUser);
      }
      return done(null, currentUser);
    }
  )
);

const callbackURL =
  process.env.NODE_ENV == "production"
    ? `${process.env.HOME_URL}/users/google/redirect/`
    : `${process.env.HOME_URL}:${process.env.PORT}/users/google/redirect`;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL,
    },
    async function (accessToken, refreshToken, profile, done) {
      const currentUser = await userModel
        .findOne({ googleId: profile.id })
        .exec();
      console.log("google strategy currentUser:", currentUser);
      if (!currentUser) {
        // console.log("google strategy new : ", currentUser);
        const newUser = await userModel.create({
          googleId: profile.id,
          fullname: profile.displayName,
          email: profile.emails![0]["value"],
          password: bcrypt.hashSync(profile.id, 12),
        });
        return done(null, newUser);
      }
      return done(null, currentUser);
    }
  )
);

interface User {
  _id?: string;
}

passport.use(
  new localStrategy(
    { usernameField: "email" },
    async (email: string, password: string, done: Function) => {
      //Vetting a user
      try {
        let user = await userModel.findOne({ email: email });
        if (!user) {
          return done(null, false, {
            message: " This email  does not exit ",
          });
        }
        const passwordMatch = bcrypt.compareSync(
          password,
          user.password as string
        );

        if (!passwordMatch) {
          return done(null, false, { message: "User password is incorrect" });
        } else {
          return done(null, user);
        }
      } catch (err) {
        console.log(err);
      }
    }
  )
);

passport.serializeUser((user: User, done) => {
  //stores a cookie in the browser with the user id inside it
  console.log("serializeUser called, loggedIn user:", user);
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  console.log("deserialize user called.");
  userModel.findById(id, function (err: Error, user: User) {
    done(err, user);
  });
});

export default passport;
