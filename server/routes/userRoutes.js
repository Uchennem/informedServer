import { Router } from "express";
import { profilesCollection, usersCollection } from "../auth.js";
import { ObjectId } from "mongodb";

const router = Router();

function normalizeInterests(user = {}) {
	const interests = Array.isArray(user.interests) ? user.interests : [];
	const interestTags = Array.isArray(user.interestTags) ? user.interestTags : [];
	return [...new Set([...interests, ...interestTags].filter(Boolean))];
}

router.get("/", async (req, res) => {
	const sessionUser = res.locals.authSession?.user ?? null;

	if (!sessionUser) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	let dbUser = null;
	if (sessionUser.id && ObjectId.isValid(sessionUser.id)) {
		dbUser = await usersCollection.findOne({ _id: new ObjectId(sessionUser.id) });
	}

	if (!dbUser && sessionUser.email) {
		dbUser = await usersCollection.findOne({ email: sessionUser.email });
	}

	let profile = null;
	if (sessionUser.id) {
		profile = await profilesCollection.findOne({ userId: sessionUser.id });
	}

	res.json({
		user: {
			id: dbUser?._id?.toString() || sessionUser.id,
			_id: dbUser?._id,
			name: dbUser?.name || sessionUser.name,
			email: dbUser?.email || sessionUser.email,
			major: profile?.major,
			year: profile?.year,
			bio: dbUser?.bio,
			avatar: dbUser?.avatar,
			interestTags: normalizeInterests(dbUser || {}),
		},
	});
});

router.get("/matches", async (req, res) => {
	const sessionUser = res.locals.authSession?.user;

	if (!sessionUser) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	try {
		let currentUser = null;

		if (sessionUser.id && ObjectId.isValid(sessionUser.id)) {
			currentUser = await usersCollection.findOne({ _id: new ObjectId(sessionUser.id) });
		}

		if (!currentUser && sessionUser.email) {
			currentUser = await usersCollection.findOne({ email: sessionUser.email });
		}

		if (!currentUser) {
			return res.json([]);
		}

		const currentInterests = normalizeInterests(currentUser);

		if (currentInterests.length === 0) {
			return res.json([]);
		}

		const candidates = await usersCollection
			.find({
				_id: { $ne: currentUser._id },
				$or: [
					{ interests: { $in: currentInterests } },
					{ interestTags: { $in: currentInterests } },
				],
			})
			.limit(20)
			.toArray();

		const matches = candidates
			.map((candidate) => {
				const sharedInterestTags = normalizeInterests(candidate).filter((interest) =>
					currentInterests.includes(interest)
				);

				return {
					id: candidate._id?.toString(),
					_id: candidate._id,
					name: candidate.name,
					major: candidate.major,
					year: candidate.year,
					sharedInterestTags,
					sharedInterests: sharedInterestTags,
				};
			})
			.filter((candidate) => candidate.sharedInterestTags.length > 0)
			.sort((a, b) => b.sharedInterestTags.length - a.sharedInterestTags.length)
			.slice(0, 5);

		return res.json(matches);
	} catch (error) {
		console.error("Error fetching matches:", error);
		return res.status(500).json({ error: "Failed to fetch matches" });
	}
});

router.post("/interests", async (req, res) => {
	const userId = res.locals.authSession?.user?.id;
	const email = res.locals.authSession?.user?.email;
	const { interests = [] } = req.body ?? {};

	if (!userId && !email) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	if (!Array.isArray(interests)) {
		return res.status(400).json({ error: "Interests must be an array" });
	}

	const normalizedInterests = [...new Set(interests.filter(Boolean))];
	const filter =
		userId && ObjectId.isValid(userId)
			? { _id: new ObjectId(userId) }
			: { email };

	await usersCollection.updateOne(
		filter,
		{
			$set: {
				interests: normalizedInterests,
				interestTags: normalizedInterests,
				updatedAt: new Date(),
			},
			$setOnInsert: {
				email,
				createdAt: new Date(),
			},
		},
		{ upsert: true },
	);

	return res.json({ interests: normalizedInterests });
});

// Get user profile by ID
router.get("/:id", async (req, res) => {
	const { id } = req.params;

	try {
		let user;

		if (ObjectId.isValid(id)) {
			user = await usersCollection.findOne({ _id: new ObjectId(id) });
		}

		if (!user) {
			user = await usersCollection.findOne({ id });
		}

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		let profile = null;
		if (user._id || user.id) {
			const userId = user._id?.toString() || user.id;
			profile = await profilesCollection.findOne({ userId });
		}

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
