import express from "express";
import dotenv from "dotenv";
import routes from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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