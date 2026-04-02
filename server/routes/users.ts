import { Router } from "express";
import { Types } from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import User from "../models/User.js";

const router = Router();

function normalizeInterests(user: {
  interests?: string[];
  interestTags?: string[];
}) {
  const interests = Array.isArray(user.interests) ? user.interests : [];
  const interestTags = Array.isArray(user.interestTags) ? user.interestTags : [];

  return [...new Set([...interests, ...interestTags].filter(Boolean))];
}

router.get("/matches", requireAuth, async (req, res) => {
  const currentUserId = res.locals.authSession?.user?.id;

  if (!currentUserId || !Types.ObjectId.isValid(currentUserId)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const currentUser = await User.findById(currentUserId)
      .select("name major year bio image interests interestTags")
      .lean();

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentInterests = normalizeInterests(currentUser);

    if (currentInterests.length === 0) {
      return res.json([]);
    }

    const candidates = await User.find({
      _id: { $ne: new Types.ObjectId(currentUserId) },
      $or: [
        { interests: { $in: currentInterests } },
        { interestTags: { $in: currentInterests } },
      ],
    })
      .select("name major year bio image interests interestTags")
      .lean();

    const matches = candidates
      .map((user) => {
        const sharedInterests = normalizeInterests(user).filter((interest) =>
          currentInterests.includes(interest),
        );

        return {
          ...user,
          sharedInterests,
          sharedInterestTags: sharedInterests,
        };
      })
      .filter((user) => user.sharedInterests.length > 0)
      .sort((a, b) => b.sharedInterests.length - a.sharedInterests.length)
      .slice(0, 5);

    return res.json(matches);
  } catch {
    return res.status(500).json({ error: "Failed to fetch matches" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    const user = await User.findById(id)
      .select("name major year bio image interests interestTags createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      ...user,
      id: String(user._id),
      avatar: user.image ?? "",
    });
  } catch {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
