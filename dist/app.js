"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
// import passport from "passport";
const cookie_session_1 = __importDefault(require("cookie-session"));
const connect_flash_1 = __importDefault(require("connect-flash"));
const users_router_1 = __importDefault(require("./routers/users_router"));
const tasks_router_1 = __importDefault(require("./routers/tasks_router"));
const project_router_1 = __importDefault(require("./routers/project_router"));
const teams_router_1 = __importDefault(require("./routers/teams_router"));
const comment_router_1 = __importDefault(require("./routers/comment_router"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const passportStrategies_1 = __importDefault(require("./authentication/passportStrategies"));
//Begining of the app
const app = (0, express_1.default)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage }).single("file");
const corsOptions = {
    //allow requests from the client
    origin: [process.env.FRONTEND_URL],
    credentials: true,
    exposedHeaders: ["Set-Cookie"],
};
// view engine setup
app.set("views", path_1.default.resolve(path_1.default.join(__dirname, "../", "views")));
app.use(express_1.default.static(path_1.default.resolve(path_1.default.join(__dirname, "../", "public"))));
app.set("view engine", "ejs");
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(upload);
app.use((0, cors_1.default)(corsOptions));
app.use((0, cookie_session_1.default)({
    maxAge: 3 * 60 * 1000,
    secret: process.env.JWT_SECRETKEY,
    keys: [
        process.env.COOKIE_SESSION_KEY1,
        process.env.COOKIE_SESSION_KEY2,
    ],
}));
app.use(passportStrategies_1.default.initialize());
app.use(passportStrategies_1.default.session());
//Connect flash
app.use((0, connect_flash_1.default)());
//GLobal Vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("sucess_msg");
    res.locals.error_msg = req.flash("error_msg");
    next();
});
/*  ROUTES

*/
app.get("/", (req, res) => {
    res.render("loginPage");
});
app.use("/users", users_router_1.default);
app.use("/tasks", tasks_router_1.default);
app.use("/projects", project_router_1.default);
app.use("/teams", teams_router_1.default);
app.use("/comments", comment_router_1.default);
//app.use(sendMail)
// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
    next((0, http_errors_1.default)(404));
});
// error handler
app.use(function (err, req, res, _next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    // render the error page
    res.status(err.status || 500).json({
        message: `Path Error: ${err.message}`,
    });
});
exports.default = app;
