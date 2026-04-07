import { Router } from "express";
import { ObjectId } from "mongodb";
import { postsCollection, savedPostsCollection, commentsCollection } from "../auth.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

const ALLOWED_CATEGORIES = ["Events", "Workshops", "Networking", "Announcements", "General"];

function serializePost(post) {
  if (!post) {
    return null;
  }

  const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();

  return {
    ...post,
    id: post._id?.toString?.() ?? post.id,
    author: post.author ?? post.authorName ?? "Unknown",
    description: post.description ?? post.body ?? "",
    rsvpCount: Array.isArray(post.rsvps) ? post.rsvps.length : post.rsvpCount ?? 0,
    date: post.eventDate
      ? new Date(post.eventDate).toISOString()
      : (post.date ?? createdAt.toISOString()),
    location: post.location ?? '',
  };
}

router.get("/", async (req, res) => {
  try {
    const query = {};
    const authorId = typeof req.query.authorId === "string" ? req.query.authorId.trim() : "";
    const author = typeof req.query.author === "string" ? req.query.author.trim() : "";

    if (req.query.category && String(req.query.category).toLowerCase() !== "all") {
      query.category = req.query.category;
    }

    if (authorId) {
      query.authorId = authorId;
    } else if (author) {
      query.$or = [{ authorName: author }, { authorId: author }];
    }

    const posts = await postsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return res.json(posts.map(serializePost));
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.get("/saved", requireAuth, async (req, res) => {
  const userId = res.locals.authSession?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const savedEntries = await savedPostsCollection.find({ userId }).toArray();
    const savedObjectIds = savedEntries
      .map((entry) => {
        if (!entry.postId || !ObjectId.isValid(entry.postId)) {
          return null;
        }

        return new ObjectId(entry.postId);
      })
      .filter(Boolean);

    if (savedObjectIds.length === 0) {
      return res.json([]);
    }

    const savedPosts = await postsCollection
      .find({ _id: { $in: savedObjectIds } })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json(savedPosts.map(serializePost));
  } catch (error) {
    console.error("[GET /api/posts/saved]", error);
    return res.status(500).json({ error: "Failed to fetch saved posts" });
  }
});

router.post("/:id/save", requireAuth, async (req, res) => {
  const userId = res.locals.authSession?.user?.id;
  const postId = req.params.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!ObjectId.isValid(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
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
  } catch (error) {
    console.error("[POST /api/posts/:id/save]", error);
    return res.status(500).json({ error: "Failed to update saved post" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, body, category, eventDate, location, maxAttendees } = req.body;

    if (!title || !body || !category) {
      return res.status(400).json({ error: "title, body, and category are required" });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`,
      });
    }

    const user = res.locals.authSession.user;
    const now = new Date();

    const doc = {
      title: title.trim(),
      body: body.trim(),
      description: body.trim(),
      category,
      authorId: user.id,
      authorName: user.name ?? "Unknown",
      author: user.name ?? "Unknown",
      rsvps: [],
      eventDate: eventDate ? new Date(eventDate) : now,
      location: typeof location === 'string' ? location.trim() : '',
      maxAttendees: Number(maxAttendees) || 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await postsCollection.insertOne(doc);
    return res.status(201).json(serializePost({ ...doc, _id: result.insertedId }));
  } catch (error) {
    console.error("[POST /api/posts]", error);
    return res.status(500).json({ error: "Failed to create post" });
  }
});

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
        error: `category must be one of: ${ALLOWED_CATEGORIES.join(", ")}`,
      });
    }

    const updates = { updatedAt: new Date() };
    if (title) {
      updates.title = title.trim();
    }
    if (body) {
      updates.body = body.trim();
      updates.description = body.trim();
    }
    if (category) {
      updates.category = category;
    }

    await postsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updates });

    const updated = await postsCollection.findOne({ _id: new ObjectId(id) });
    return res.json(serializePost(updated));
  } catch (error) {
    console.error("[PUT /api/posts/:id]", error);
    return res.status(500).json({ error: "Failed to update post" });
  }
});

router.post("/:id/rsvp", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = res.locals.authSession?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const postId = new ObjectId(id);
    const existing = await postsCollection.findOne({ _id: postId }, { projection: { rsvps: 1 } });

    if (!existing) {
      return res.status(404).json({ error: "Post not found" });
    }

    const alreadyRsvped = Array.isArray(existing.rsvps) && existing.rsvps.includes(userId);

    await postsCollection.updateOne(
      { _id: postId },
      alreadyRsvped
        ? { $pull: { rsvps: userId }, $set: { updatedAt: new Date() } }
        : { $addToSet: { rsvps: userId }, $set: { updatedAt: new Date() } },
    );

    const updated = await postsCollection.findOne({ _id: postId }, { projection: { rsvps: 1 } });

    return res.json({
      rsvpCount: Array.isArray(updated?.rsvps) ? updated.rsvps.length : 0,
      isRsvped: !alreadyRsvped,
    });
  } catch (error) {
    console.error("[POST /api/posts/:id/rsvp]", error);
    return res.status(500).json({ error: "Failed to update RSVP" });
  }
});

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

router.get("/:id/comments", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid post id" });
  try {
    const comments = await commentsCollection
      .find({ postId: id })
      .sort({ createdAt: 1 })
      .toArray();
    return res.json(comments.map(c => ({
      id: c._id.toString(),
      postId: c.postId,
      authorId: c.authorId,
      authorName: c.authorName,
      body: c.body,
      createdAt: c.createdAt,
    })));
  } catch (error) {
    console.error("[GET /api/posts/:id/comments]", error);
    return res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/:id/comments", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid post id" });
  if (!body?.trim()) return res.status(400).json({ error: "Comment body is required" });
  if (body.length > 1000) return res.status(400).json({ error: "Comment too long" });
  const sessionUser = res.locals.authSession?.user;
  const now = new Date();
  try {
    const result = await commentsCollection.insertOne({
      postId: id,
      authorId: sessionUser.id,
      authorName: sessionUser.name ?? "Anonymous",
      body: body.trim(),
      createdAt: now,
      updatedAt: now,
    });
    return res.status(201).json({
      id: result.insertedId.toString(),
      postId: id,
      authorId: sessionUser.id,
      authorName: sessionUser.name ?? "Anonymous",
      body: body.trim(),
      createdAt: now,
    });
  } catch (error) {
    console.error("[POST /api/posts/:id/comments]", error);
    return res.status(500).json({ error: "Failed to post comment" });
  }
});

export default router;
