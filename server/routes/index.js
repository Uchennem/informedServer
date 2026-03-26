import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    name: "Informed API",
    status: "ok",
    authBasePath: "/api/auth",
  });
});

export default router;