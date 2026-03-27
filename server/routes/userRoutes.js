import { Router } from "express";
import { profilesCollection, usersCollection } from "../auth.js";
import { ObjectId } from "mongodb";

const router = Router();

router.get("/", (req, res) => {
	res.json({ message: "Users route (protected)", user: res.locals.authSession?.user ?? null });
});

// Get user profile by ID
router.get("/:id", async (req, res) => {
	const { id } = req.params;

	try {
		// Try to find the user in the database
		let user;

		// First check if ID is a valid MongoDB ObjectId
		if (ObjectId.isValid(id)) {
			user = await usersCollection.findOne({ _id: new ObjectId(id) });
		}

		// If not found and ID is a string, try searching by ID field
		if (!user) {
			user = await usersCollection.findOne({ id });
		}

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Get the user's profile data if it exists
		let profile = null;
		if (user._id || user.id) {
			const userId = user._id?.toString() || user.id;
			profile = await profilesCollection.findOne({ userId });
		}

		// Return combined user and profile data
		res.json({
			id: user._id?.toString() || user.id,
			_id: user._id,
			name: user.name,
			email: user.email,
			major: profile?.major,
			year: profile?.year,
			bio: user.bio,
			avatar: user.avatar,
			interestTags: user.interestTags || user.interests || [],
			createdAt: user.createdAt,
		});
	} catch (error) {
		console.error("Error fetching user profile:", error);
		res.status(500).json({ error: "Failed to fetch user profile" });
	}
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
