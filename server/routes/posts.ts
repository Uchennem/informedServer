import { Router } from "express";
import { Types } from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import Post from "../models/Post.js";

const router = Router();

router.get("/", async (req, res) => {
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const filters =
    category && category.toLowerCase() !== "all"
      ? { category: new RegExp(`^${category}$`, "i") }
      : {};

  try {
    const posts = await Post.find(filters)
      .populate("authorId", "name")
      .sort({ eventDate: 1, createdAt: -1 })
      .lean();

    return res.json(
      posts.map((post) => ({
        id: String(post._id),
        title: post.title,
        body: post.body ?? "",
        category: post.category ?? "General",
        location: post.location ?? "",
        date: post.eventDate,
        author:
          typeof post.authorId === "object" && post.authorId?.name
            ? post.authorId.name
            : "Campus Activity",
        rsvpCount: Array.isArray(post.rsvps) ? post.rsvps.length : 0,
      })),
    );
  } catch {
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.post("/:id/rsvp", requireAuth, async (req, res) => {
  const userId = res.locals.authSession?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const post = await Post.findById(req.params.id).select("rsvps");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const memberId = new Types.ObjectId(userId);
    const isAlreadyRsvped = post.rsvps.some((rsvpId) => rsvpId.equals(memberId));

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      isAlreadyRsvped
        ? { $pull: { rsvps: memberId } }
        : { $addToSet: { rsvps: memberId } },
      { new: true },
    ).select("rsvps");

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.json({
      rsvpCount: updatedPost.rsvps.length,
      isRsvped: !isAlreadyRsvped,
    });
  } catch {
    return res.status(400).json({ error: "Failed to update RSVP" });
  }
});

export default router;
