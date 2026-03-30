import { Router } from "express";
import { profilesCollection, usersCollection } from "../auth.js";
import { ObjectId } from "mongodb";

const router = Router();

function getUserInterests(user) {
	if (!user || typeof user !== "object") {
		return [];
	}

	const candidate = Array.isArray(user.interests)
		? user.interests
		: Array.isArray(user.interestTags)
			? user.interestTags
			: [];

	return candidate
		.filter((value) => typeof value === "string")
		.map((value) => value.trim())
		.filter(Boolean);
}

function normalizeInterests(interests) {
	if (!Array.isArray(interests)) {
		return [];
	}

	const deduped = new Set();

	for (const value of interests) {
		if (typeof value !== "string") {
			continue;
		}

		const normalized = value.trim();
		if (!normalized) {
			continue;
		}

		deduped.add(normalized);
	}

	return Array.from(deduped);
}

async function findUserBySessionId(sessionUserId) {
	if (!sessionUserId) {
		return null;
	}

	let user = await usersCollection.findOne({ id: sessionUserId });

	if (!user && ObjectId.isValid(sessionUserId)) {
		user = await usersCollection.findOne({ _id: new ObjectId(sessionUserId) });
	}

	return user;
}

router.get("/", (req, res) => {
	res.json({ message: "Users route (protected)", user: res.locals.authSession?.user ?? null });
});

router.get("/me", async (req, res) => {
	const sessionUser = res.locals.authSession?.user;
	const userId = sessionUser?.id;

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	try {
		const user = await findUserBySessionId(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const interests = getUserInterests(user);

		return res.json({
			id: user._id?.toString() || user.id,
			name: user.name,
			email: user.email,
			interests,
			interestTags: interests,
			needsOnboarding: interests.length === 0,
		});
	} catch (error) {
		console.error("Error fetching current user:", error);
		return res.status(500).json({ error: "Failed to fetch current user" });
	}
});

router.post("/interests", async (req, res) => {
	const sessionUser = res.locals.authSession?.user;
	const userId = sessionUser?.id;

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const normalizedInterests = normalizeInterests(req.body?.interests);

	if (normalizedInterests.length === 0) {
		return res.status(400).json({ error: "At least one interest is required" });
	}

	try {
		const user = await findUserBySessionId(userId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const now = new Date();

		await usersCollection.updateOne(
			{ _id: user._id },
			{
				$set: {
					interests: normalizedInterests,
					interestTags: normalizedInterests,
					onboardingCompletedAt: now,
					updatedAt: now,
				},
			},
		);

		return res.json({
			message: "Interests saved successfully",
			interests: normalizedInterests,
			needsOnboarding: false,
		});
	} catch (error) {
		console.error("Error saving user interests:", error);
		return res.status(500).json({ error: "Failed to save interests" });
	}
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
			interestTags: getUserInterests(user),
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
