import { Router } from "express";
import { ObjectId } from "mongodb";
import { notificationsCollection } from "../auth.js";

const router = Router();

router.get("/", async (req, res) => {
  const userId = res.locals.authSession?.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const query = { recipientId: userId };
    if (req.query.unread === "true") query.read = false;
    const notes = await notificationsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    return res.json(notes.map(n => ({
      id: n._id.toString(),
      type: n.type,
      senderId: n.senderId,
      senderName: n.senderName,
      read: n.read,
      createdAt: n.createdAt,
    })));
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.patch("/read-all", async (req, res) => {
  const userId = res.locals.authSession?.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  try {
    await notificationsCollection.updateMany(
      { recipientId: userId, read: false },
      { $set: { read: true, updatedAt: new Date() } },
    );
    return res.json({ ok: true });
  } catch (error) {
    console.error("[PATCH /api/notifications/read-all]", error);
    return res.status(500).json({ error: "Failed to mark all notifications read" });
  }
});

router.patch("/:id/read", async (req, res) => {
  const userId = res.locals.authSession?.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    await notificationsCollection.updateOne(
      { _id: new ObjectId(id), recipientId: userId },
      { $set: { read: true, updatedAt: new Date() } },
    );
    return res.json({ id, read: true });
  } catch (error) {
    console.error("[PATCH /api/notifications/:id/read]", error);
    return res.status(500).json({ error: "Failed to mark notification read" });
  }
});

export default router;
