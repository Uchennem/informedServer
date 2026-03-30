import { Router } from "express";
import { savedPostsCollection } from "../auth.js";

const router = Router();

const posts = [
	{
		id: "post-1",
		title: "Hack Night Kickoff",
		author: "CS Club",
		category: "Events",
		rsvpCount: 24,
		date: "2026-03-28T18:00:00.000Z",
		rsvps: [],
	},
	{
		id: "post-2",
		title: "Design Critique Session",
		author: "Design Lab",
		category: "Workshops",
		rsvpCount: 12,
		date: "2026-04-01T16:30:00.000Z",
		rsvps: [],
	},
	{
		id: "post-3",
		title: "Startup Pitch Practice",
		author: "Founders Forum",
		category: "Networking",
		rsvpCount: 17,
		date: "2026-04-03T17:00:00.000Z",
		rsvps: [],
	},
];

router.get("/", (req, res) => {
	const { author, category } = req.query;

	let results = [...posts];

	if (category && String(category).toLowerCase() !== "all") {
		results = results.filter(
			(post) => post.category.toLowerCase() === String(category).toLowerCase()
		);
	}

	// Filter posts by author if provided
	if (author) {
		const filteredPosts = results.filter(
			(post) => post.author.toLowerCase() === author.toLowerCase()
		);
		return res.json(filteredPosts);
	}

	res.json(results);
});

router.post("/:id/rsvp", (req, res) => {
	const userId = res.locals.authSession?.user?.id;
	const post = posts.find((entry) => entry.id === req.params.id);

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	if (!post) {
		return res.status(404).json({ error: "Post not found" });
	}

	const isRsvped = post.rsvps.includes(userId);

	if (isRsvped) {
		post.rsvps = post.rsvps.filter((id) => id !== userId);
		post.rsvpCount = Math.max(0, post.rsvpCount - 1);
	} else {
		post.rsvps.push(userId);
		post.rsvpCount += 1;
	}

	return res.json({
		rsvpCount: post.rsvpCount,
		isRsvped: !isRsvped,
	});
});

router.get("/saved", async (req, res) => {
	const userId = res.locals.authSession?.user?.id;

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const savedEntries = await savedPostsCollection.find({ userId }).toArray();
	const savedIds = new Set(savedEntries.map((entry) => entry.postId));
	const savedPosts = posts.filter((post) => savedIds.has(post.id));

	return res.json(savedPosts);
});

router.post("/:id/save", async (req, res) => {
	const userId = res.locals.authSession?.user?.id;
	const postId = req.params.id;
	const post = posts.find((entry) => entry.id === postId);

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	if (!post) {
		return res.status(404).json({ error: "Post not found" });
	}

	const existing = await savedPostsCollection.findOne({ userId, postId });

	if (existing) {
		await savedPostsCollection.deleteOne({ userId, postId });
		return res.json({ saved: false, postId });
	}

	await savedPostsCollection.insertOne({ userId, postId, createdAt: new Date() });
	return res.json({ saved: true, postId });
});

export default router;
