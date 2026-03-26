import { Router } from "express";

const router = Router();

const posts = [
	{
		id: "post-1",
		title: "Hack Night Kickoff",
		author: "CS Club",
		category: "Events",
		rsvpCount: 24,
		date: "2026-03-28T18:00:00.000Z",
	},
	{
		id: "post-2",
		title: "Design Critique Session",
		author: "Design Lab",
		category: "Workshops",
		rsvpCount: 12,
		date: "2026-04-01T16:30:00.000Z",
	},
	{
		id: "post-3",
		title: "Startup Pitch Practice",
		author: "Founders Forum",
		category: "Networking",
		rsvpCount: 17,
		date: "2026-04-03T17:00:00.000Z",
	},
];

router.get("/", (req, res) => {
	const { author } = req.query;

	// Filter posts by author if provided
	if (author) {
		const filteredPosts = posts.filter(
			(post) => post.author.toLowerCase() === author.toLowerCase()
		);
		return res.json(filteredPosts);
	}

	res.json(posts);
});

export default router;
