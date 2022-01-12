import createError from "http-errors";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
// import passport from "passport";
import cookieSession from "cookie-session";
import flash from "connect-flash";
import mainUsersRouter from "./routers/users_router";
import tasksRouter from "./routers/tasks_router";
import mainProjectRouter from "./routers/project_router";
import mainTeamRouter from "./routers/teams_router";
import mainCommentRouter from "./routers/comment_router";
import multer from "multer";
import cors from "cors";
import passport from "./authentication/passportStrategies";

//Begining of the app
const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

const corsOptions = {
  //allow requests from the client
  origin: [process.env.FRONTEND_URL as string],
  credentials: true,
  exposedHeaders: ["Set-Cookie"],
};

// view engine setup
app.set("views", path.resolve(path.join(__dirname, "../", "views")));
app.use(express.static(path.resolve(path.join(__dirname, "../", "public"))));
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(upload);
app.use(cors(corsOptions));

app.use(
  cookieSession({
    maxAge: 3 * 60 * 1000, //3 MINUTES
    secret: process.env.JWT_SECRETKEY,
    keys: [
      process.env.COOKIE_SESSION_KEY1 as string,
      process.env.COOKIE_SESSION_KEY2 as string,
    ],
  })
);

app.use(passport.initialize());
app.use(passport.session());

//Connect flash
app.use(flash());
//GLobal Vars
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.success_msg = req.flash("sucess_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

/*  ROUTES

*/
app.get("/", (req: express.Request, res: express.Response) => {
  res.render("loginPage");
});
app.use("/users", mainUsersRouter);
app.use("/tasks", tasksRouter);
app.use("/projects", mainProjectRouter);
app.use("/teams", mainTeamRouter);
app.use("/comments", mainCommentRouter);

//app.use(sendMail)
// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
  next(createError(404));
});

// error handler
app.use(function (
  err: createError.HttpError,
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500).json({
    message: `Path Error: ${err.message}`,
  });
});

export default app;
