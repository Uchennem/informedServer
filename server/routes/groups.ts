import { Router } from "express";
import { Types } from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import Group from "../models/Group.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    return res.json(groups);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch groups" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const userId = res.locals.authSession?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const group = await Group.create({
      ...req.body,
      createdBy: new Types.ObjectId(userId),
      members: [new Types.ObjectId(userId)],
    });

    return res.status(201).json(group);
  } catch (error) {
    return res.status(400).json({ error: "Failed to create group" });
  }
});

router.post("/:id/join", requireAuth, async (req, res) => {
  const userId = res.locals.authSession?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: {
          members: new Types.ObjectId(userId),
        },
      },
      { new: true },
    );

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json(group);
  } catch (error) {
    return res.status(400).json({ error: "Failed to join group" });
  }
});

router.delete("/:id/leave", requireAuth, async (req, res) => {
  const userId = res.locals.authSession?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          members: new Types.ObjectId(userId),
        },
      },
      { new: true },
    );

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json(group);
  } catch (error) {
    return res.status(400).json({ error: "Failed to leave group" });
  }
});

export default router;
