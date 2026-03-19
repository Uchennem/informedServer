import { Router } from "express";

const router = Router();

// Index route
router.get("/", (req, res) => {
  res.json({ title: "Home Route" });
});

export default router;