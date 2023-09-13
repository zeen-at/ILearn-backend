import express from "express";
import logger from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import router from "./routes/usersRoutes";
import coursesRouter from "./routes/coursesRoutes";
import { connectDB } from "./Config/index";
import dotenv from "dotenv";
import { swaggerDoc } from "./utils";
import https from "https";
import fs from "fs";

import {
  appError,
  errorHandler,
  notFound,
} from "./Middlewares/errorMiddleware";
import { verifyPayment } from "./Middlewares/authMiddleware";
import passport from "passport";
import session from "express-session";
import "./utils/passport";

import { json } from "body-parser";
import { fboauthBackend } from "./utils/fb-auth/fbAuth";
dotenv.config();

const options = {
  key: fs.readFileSync(process.env.HTTP_KEY as string, "utf8"),
  cert: fs.readFileSync(process.env.HTTP_CERT as string, "utf8"),
};

// this calls the database connection
connectDB();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(logger("dev"));
app.use(cookieParser());
app.use(session({ secret: `${process.env.sessionSecret}` }));
app.use(passport.initialize());
app.use(passport.session());

swaggerDoc(app);
fboauthBackend(app);
app.use(json());
app.use("/", router);

//routes
app.use("/users", router);
app.use("/courses", coursesRouter);

// app.get("/", (req, res) => {
//   res.status(200).send("api is running");
// });
// not found error handler

app.use(notFound);
// error handler
app.use(errorHandler);
// app.use(appError);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// https.createServer(options, app).listen(4000, () => {
//   console.log(`HTTPS server started on port 4000`);
// });

export default app;
