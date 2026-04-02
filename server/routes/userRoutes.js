import { Router } from "express";
import { appDatabase, profilesCollection, usersCollection } from "../auth.js";
import { ObjectId } from "mongodb";

const router = Router();
const connectionRequestsCollection = appDatabase.collection("connectionRequests");

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

async function findUserForSession(sessionUser) {
  if (!sessionUser) {
    return null;
  }

  let user = await findUserBySessionId(sessionUser.id);

  if (!user && sessionUser.email) {
    user = await usersCollection.findOne({ email: sessionUser.email });
  }

  return user;
}

function getCanonicalUserId(user, fallbackId = null) {
  return user?._id?.toString() || user?.id || fallbackId;
}

function normalizeComparableText(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function toConnectionTargetIds(user) {
  const ids = [user?._id?.toString?.(), user?.id]
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(ids));
}

async function getRequestedTargetIds(requesterId, targetIds) {
  const normalizedTargetIds = Array.from(new Set(targetIds.filter(Boolean)));

  if (!requesterId || normalizedTargetIds.length === 0) {
    return new Set();
  }

  const pendingRequests = await connectionRequestsCollection
    .find({
      requesterId,
      targetId: { $in: normalizedTargetIds },
      status: "pending",
    })
    .toArray();

  return new Set(
    pendingRequests
      .map((request) => request.targetId)
      .filter((targetId) => typeof targetId === "string" && targetId.trim().length > 0),
  );
}

async function findUserByAnyId(id) {
  if (!id) {
    return null;
  }

  if (ObjectId.isValid(id)) {
    const byObjectId = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (byObjectId) {
      return byObjectId;
    }
  }

  return usersCollection.findOne({ id });
}

router.get("/", async (req, res) => {
  const sessionUser = res.locals.authSession?.user ?? null;

  if (!sessionUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await findUserForSession(sessionUser);
    const interests = getUserInterests(user);
    let profile = null;

    if (sessionUser.id) {
      profile = await profilesCollection.findOne({ userId: sessionUser.id });
    }

    return res.json({
      user: {
        id: user?._id?.toString() || user?.id || sessionUser.id,
        _id: user?._id,
        name: user?.name || sessionUser.name,
        email: user?.email || sessionUser.email,
        major: profile?.major,
        year: profile?.year,
        bio: user?.bio,
        avatar: user?.avatar,
        interestTags: interests,
      },
    });
  } catch (error) {
    console.error("Error fetching current session user:", error);
    return res.status(500).json({ error: "Failed to fetch current user" });
  }
});

router.get("/me", async (req, res) => {
  const sessionUser = res.locals.authSession?.user;
  const userId = sessionUser?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await findUserForSession(sessionUser);
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

router.get("/matches", async (req, res) => {
  const sessionUser = res.locals.authSession?.user;

  if (!sessionUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const currentUser = await findUserForSession(sessionUser);

    if (!currentUser) {
      return res.json([]);
    }

    const requesterId = getCanonicalUserId(currentUser, sessionUser.id);
    const currentInterests = getUserInterests(currentUser);
    const currentMajor = normalizeComparableText(currentUser.major);

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

    const allCandidateConnectionTargetIds = candidates.flatMap((candidate) =>
      toConnectionTargetIds(candidate),
    );

    const requestedTargetIds = await getRequestedTargetIds(
      requesterId,
      allCandidateConnectionTargetIds,
    );

    const matches = candidates
      .map((candidate) => {
        const sharedInterestTags = getUserInterests(candidate).filter((interest) =>
          currentInterests.includes(interest),
        );

        const candidateMajor = normalizeComparableText(candidate.major);
        const candidateTargetIds = toConnectionTargetIds(candidate);
        const isRequested = candidateTargetIds.some((targetId) => requestedTargetIds.has(targetId));

        return {
          id: candidate._id?.toString() || candidate.id,
          _id: candidate._id,
          name: candidate.name,
          major: candidate.major,
          year: candidate.year,
          sharedInterestTags,
          sharedInterests: sharedInterestTags,
          isRequested,
          sameMajor: Boolean(currentMajor && candidateMajor && currentMajor === candidateMajor),
        };
      })
      .filter((candidate) => candidate.sharedInterestTags.length > 0)
      .sort((a, b) => {
        const interestDelta = b.sharedInterestTags.length - a.sharedInterestTags.length;
        if (interestDelta !== 0) {
          return interestDelta;
        }

        if (a.sameMajor !== b.sameMajor) {
          return a.sameMajor ? -1 : 1;
        }

        return String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
          sensitivity: "base",
        });
      })
      .slice(0, 5);

    return res.json(matches.map(({ sameMajor, ...candidate }) => candidate));
  } catch (error) {
    console.error("Error fetching matches:", error);
    return res.status(500).json({ error: "Failed to fetch matches" });
  }
});

router.get("/search", async (req, res) => {
  const sessionUser = res.locals.authSession?.user;

  if (!sessionUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const query = String(req.query.q ?? "").trim();

  if (query.length < 2) {
    return res.json([]);
  }

  try {
    const currentUser = await findUserForSession(sessionUser);
    if (!currentUser) {
      return res.json([]);
    }

    const requesterId = getCanonicalUserId(currentUser, sessionUser.id);
    const currentUserObjectId = currentUser?._id;
    const currentInterests = getUserInterests(currentUser);
    const currentMajor = normalizeComparableText(currentUser.major);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedQuery, "i");

    const candidates = await usersCollection
      .find({
        ...(currentUserObjectId ? { _id: { $ne: currentUserObjectId } } : {}),
        $or: [{ name: searchRegex }, { major: searchRegex }],
      })
      .limit(20)
      .toArray();

    const allCandidateConnectionTargetIds = candidates.flatMap((candidate) =>
      toConnectionTargetIds(candidate),
    );

    const requestedTargetIds = await getRequestedTargetIds(
      requesterId,
      allCandidateConnectionTargetIds,
    );

    const results = candidates
      .map((candidate) => {
        const sharedInterestTags = getUserInterests(candidate).filter((interest) =>
          currentInterests.includes(interest),
        );
        const candidateMajor = normalizeComparableText(candidate.major);
        const candidateTargetIds = toConnectionTargetIds(candidate);

        return {
          id: candidate._id?.toString() || candidate.id,
          _id: candidate._id,
          name: candidate.name,
          major: candidate.major,
          year: candidate.year,
          sharedInterestTags,
          sharedInterests: sharedInterestTags,
          isRequested: candidateTargetIds.some((targetId) => requestedTargetIds.has(targetId)),
          sameMajor: Boolean(currentMajor && candidateMajor && currentMajor === candidateMajor),
        };
      })
      .filter((candidate) => candidate.id !== requesterId)
      .sort((a, b) => {
        if (a.sameMajor !== b.sameMajor) {
          return a.sameMajor ? -1 : 1;
        }

        return String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
          sensitivity: "base",
        });
      });

    return res.json(results.map(({ sameMajor, ...candidate }) => candidate));
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ error: "Failed to search users" });
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
    let user = await findUserForSession(sessionUser);
    if (!user) {
      if (!sessionUser?.email) {
        return res.status(404).json({ error: "User not found" });
      }

      const now = new Date();
      const result = await usersCollection.insertOne({
        id: userId,
        email: sessionUser.email,
        name: sessionUser.name ?? sessionUser.email,
        interests: normalizedInterests,
        interestTags: normalizedInterests,
        onboardingCompletedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      return res.json({
        message: "Interests saved successfully",
        interests: normalizedInterests,
        needsOnboarding: false,
        id: result.insertedId.toString(),
      });
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

router.post("/:id/connect", async (req, res) => {
  const sessionUser = res.locals.authSession?.user;
  const requesterSessionId = sessionUser?.id;
  const targetParamId = req.params.id;

  if (!requesterSessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const requesterUser = await findUserForSession(sessionUser);
    if (!requesterUser) {
      return res.status(404).json({ error: "Requester not found" });
    }

    const targetUser = await findUserByAnyId(targetParamId);

    const requesterId = getCanonicalUserId(requesterUser, requesterSessionId);
    const targetId = getCanonicalUserId(targetUser, targetParamId);

    if (!requesterId || !targetId) {
      return res.status(400).json({ error: "Invalid connection request" });
    }

    if (requesterId === targetId) {
      return res.status(400).json({ error: "Cannot connect with yourself" });
    }

    const now = new Date();

    await connectionRequestsCollection.updateOne(
      { requesterId, targetId },
      {
        $set: {
          requesterId,
          targetId,
          status: "pending",
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return res.json({ requested: true });
  } catch (error) {
    console.error("Error creating connection request:", error);
    return res.status(500).json({ error: "Failed to create connection request" });
  }
});

router.delete("/:id/connect", async (req, res) => {
  const sessionUser = res.locals.authSession?.user;
  const requesterSessionId = sessionUser?.id;
  const targetParamId = req.params.id;

  if (!requesterSessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const requesterUser = await findUserForSession(sessionUser);
    if (!requesterUser) {
      return res.status(404).json({ error: "Requester not found" });
    }

    const targetUser = await findUserByAnyId(targetParamId);

    const requesterId = getCanonicalUserId(requesterUser, requesterSessionId);
    const targetId = getCanonicalUserId(targetUser, targetParamId);

    if (!requesterId || !targetId) {
      return res.status(400).json({ error: "Invalid connection request" });
    }

    await connectionRequestsCollection.deleteOne({ requesterId, targetId });

    return res.json({ requested: false });
  } catch (error) {
    console.error("Error deleting connection request:", error);
    return res.status(500).json({ error: "Failed to delete connection request" });
  }
});

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
      const profileUserId = user._id?.toString() || user.id;
      profile = await profilesCollection.findOne({ userId: profileUserId });
    }

    return res.json({
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
    return res.status(500).json({ error: "Failed to fetch user profile" });
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

  return res.json({
    message: "Profile updated successfully",
    profile: savedProfile,
    user: res.locals.authSession.user,
  });
});

export default router;
