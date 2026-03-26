import { Router } from "express";
import { profilesCollection } from "../auth.js";

const router = Router();

router.get("/", (req, res) => {
	res.json({ message: "Users route (protected)", user: res.locals.authSession?.user ?? null });
});

router.put("/profile", async (req, res) => {
	const { major, year } = req.body;
	const userId = res.locals.authSession?.user?.id;

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	if (!major || !year) {
		return res.status(400).json({ error: "Major and year are required" });
	}

	const nextProfile = {
		userId,
		major,
		year,
		updatedAt: new Date(),
	};

	await profilesCollection.updateOne(
		{ userId },
		{
			$set: nextProfile,
			$setOnInsert: {
				createdAt: new Date(),
			},
		},
		{ upsert: true },
	);

	const savedProfile = await profilesCollection.findOne({ userId }, { projection: { _id: 0 } });

	res.json({ 
		message: "Profile updated successfully",
		profile: savedProfile,
		user: res.locals.authSession.user,
	});
});

export default router;
