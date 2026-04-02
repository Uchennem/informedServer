import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import postsRouter from "./routes/posts.js";
import routes from "./routes/index.js";
import usersRouter from "./routes/users.js";
import groupsRouter from "./routes/groups.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const allowedOrigins = (process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? "http://localhost:4321")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable.");
}

await mongoose.connect(MONGODB_URI);

app.set("trust proxy", 1);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authHandler = toNodeHandler(auth);

app.all("/api/auth/*path", (req, res) => authHandler(req, res));
app.use("/api/users", usersRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/posts", postsRouter);
app.use("/", routes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
