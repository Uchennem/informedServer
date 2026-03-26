import express from "express";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import requireAuth from "./middleware/requireAuth.js";
import groupsRoutes from "./routes/groupsRoutes.js";
import postsRoutes from "./routes/postsRoutes.js";
import routes from "./routes/index.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authHandler = toNodeHandler(auth);

app.all("/api/auth/*path", (req, res) => authHandler(req, res));
app.use("/api/users", requireAuth, userRoutes);
app.use("/api/groups", requireAuth, groupsRoutes);
app.use("/api/posts", requireAuth, postsRoutes);

// Routes
app.use("/", routes);

app.get("/about", (req, res) => {
  res.send("About page");
});

app.post("/data", (req, res) => {
  const data = req.body;
  res.json({
    message: "Data received successfully",
    receivedData: data,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
