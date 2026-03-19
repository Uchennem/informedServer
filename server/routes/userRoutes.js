import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
	res.json({ message: "Users route (protected)", user: res.locals.authSession?.user ?? null });
});

export default router;
