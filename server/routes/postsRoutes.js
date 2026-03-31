import { Router } from "express";
import { ObjectId } from "mongodb";
import { postsCollection } from "../auth.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

const ALLOWED_CATEGORIES = ["Events", "Workshops", "Networking", "Announcements", "General"];

// ─── GET /api/posts ──────────────────────────────────────────────────────────
// Public. Sorted by newest first. Supports ?category= filter.
router.get("/", async (req, res) => {
	try {
		const query = {};
		if (req.query.category) {
			query.category = req.query.category;
		}

		const posts = await postsCollection
			.find(query)
			.sort({ createdAt: -1 })
			.toArray();

		return res.json(posts);
	} catch (error) {
		console.error("[GET /api/posts]", error);
		return res.status(500).json({ error: "Failed to fetch posts" });
	}
});

// ─── POST /api/posts ─────────────────────────────────────────────────────────
// Requires auth. Creates a new post.
router.post("/", requireAuth, async (req, res) => {
	try {
		const { title, body, category } = req.body;

		if (!title || !body || !category) {
			return res.status(400).json({ error: "title, body, and category are required" });
		}

		if (!ALLOWED_CATEGORIES.includes(category)) {
			return res.status(400).json({
				error: `category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`
			});
		}

		const user = res.locals.authSession.user;
		const now = new Date();

		const doc = {
			title: title.trim(),
			body: body.trim(),
			category,
			authorId: user.id,
			authorName: user.name ?? "Unknown",
			createdAt: now,
			updatedAt: now,
		};

		const result = await postsCollection.insertOne(doc);
		return res.status(201).json({ ...doc, _id: result.insertedId });
	} catch (error) {
		console.error("[POST /api/posts]", error);
		return res.status(500).json({ error: "Failed to create post" });
	}
});

// ─── PUT /api/posts/:id ───────────────────────────────────────────────────────
// Requires auth. Author only.
router.put("/:id", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;

		if (!ObjectId.isValid(id)) {
			return res.status(400).json({ error: "Invalid post id" });
		}

		const post = await postsCollection.findOne({ _id: new ObjectId(id) });

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userId = res.locals.authSession.user.id;
		if (post.authorId !== userId) {
			return res.status(403).json({ error: "Forbidden: you are not the author of this post" });
		}

		const { title, body, category } = req.body;

		if (category && !ALLOWED_CATEGORIES.includes(category)) {
			return res.status(400).json({
				error: `category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`
			});
		}

		const updates = { updatedAt: new Date() };
		if (title) updates.title = title.trim();
		if (body) updates.body = body.trim();
		if (category) updates.category = category;

		await postsCollection.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: updates }
		);

		const updated = await postsCollection.findOne({ _id: new ObjectId(id) });
		return res.json(updated);
	} catch (error) {
		console.error("[PUT /api/posts/:id]", error);
		return res.status(500).json({ error: "Failed to update post" });
	}
});

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────
// Requires auth. Author only.
router.delete("/:id", requireAuth, async (req, res) => {
	try {
		const { id } = req.params;

		if (!ObjectId.isValid(id)) {
			return res.status(400).json({ error: "Invalid post id" });
		}

		const post = await postsCollection.findOne({ _id: new ObjectId(id) });

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userId = res.locals.authSession.user.id;
		if (post.authorId !== userId) {
			return res.status(403).json({ error: "Forbidden: you are not the author of this post" });
		}

		await postsCollection.deleteOne({ _id: new ObjectId(id) });
		return res.json({ message: "Post deleted successfully", id });
	} catch (error) {
		console.error("[DELETE /api/posts/:id]", error);
		return res.status(500).json({ error: "Failed to delete post" });
	}
});

export default router;
