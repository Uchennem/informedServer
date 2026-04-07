import { Router } from "express";
import { appDatabase, profilesCollection, usersCollection, notificationsCollection } from "../auth.js";
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
  return user?.id || user?._id?.toString() || fallbackId;
}

function getProfileCandidateIds(user, fallbackId = null) {
  const ids = [user?.id, user?._id?.toString?.(), fallbackId]
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(ids));
}

async function findProfileForUser(user, fallbackId = null) {
  const candidateIds = getProfileCandidateIds(user, fallbackId);

  if (candidateIds.length === 0) {
    return null;
  }

  return profilesCollection.findOne({ userId: { $in: candidateIds } });
}

async function buildProfileLookup(users = [], fallbackIds = []) {
  const candidateIds = Array.from(
    new Set(
      [...fallbackIds, ...users.flatMap((user) => getProfileCandidateIds(user))].filter(
        (value) => typeof value === "string" && value.trim().length > 0,
      ),
    ),
  );

  if (candidateIds.length === 0) {
    return new Map();
  }

  const profiles = await profilesCollection.find({ userId: { $in: candidateIds } }).toArray();
  return new Map(profiles.map((profile) => [profile.userId, profile]));
}

function getProfileFromLookup(user, profileLookup, fallbackId = null) {
  for (const candidateId of getProfileCandidateIds(user, fallbackId)) {
    if (profileLookup.has(candidateId)) {
      return profileLookup.get(candidateId);
    }
  }

  return null;
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
    const profile = await findProfileForUser(user, sessionUser.id);

    return res.json({
      user: {
        id: getCanonicalUserId(user, sessionUser.id),
        _id: user?._id,
        name: user?.name || sessionUser.name,
        email: user?.email || sessionUser.email,
        major: profile?.major ?? user?.major,
        year: profile?.year ?? user?.year,
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
    const profile = await findProfileForUser(user, userId);

    return res.json({
      id: getCanonicalUserId(user, userId),
      name: user.name,
      email: user.email,
      major: profile?.major ?? user?.major,
      year: profile?.year ?? user?.year,
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
    const currentProfile = await findProfileForUser(currentUser, sessionUser.id);
    const currentMajor = normalizeComparableText(currentProfile?.major ?? currentUser.major);

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
    const candidateProfiles = await buildProfileLookup(candidates);

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
        const profile = getProfileFromLookup(candidate, candidateProfiles);
        const major = profile?.major ?? candidate.major;
        const year = profile?.year ?? candidate.year;

        const candidateMajor = normalizeComparableText(major);
        const candidateTargetIds = toConnectionTargetIds(candidate);
        const isRequested = candidateTargetIds.some((targetId) => requestedTargetIds.has(targetId));

        return {
          id: getCanonicalUserId(candidate),
          _id: candidate._id,
          name: candidate.name,
          major,
          year,
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
    const currentProfile = await findProfileForUser(currentUser, sessionUser.id);
    const currentMajor = normalizeComparableText(currentProfile?.major ?? currentUser.major);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedQuery, "i");

    const candidates = await usersCollection
      .find({
        ...(currentUserObjectId ? { _id: { $ne: currentUserObjectId } } : {}),
        $or: [{ name: searchRegex }, { major: searchRegex }],
      })
      .limit(20)
      .toArray();
    const candidateProfiles = await buildProfileLookup(candidates);

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
        const profile = getProfileFromLookup(candidate, candidateProfiles);
        const major = profile?.major ?? candidate.major;
        const year = profile?.year ?? candidate.year;
        const candidateMajor = normalizeComparableText(major);
        const candidateTargetIds = toConnectionTargetIds(candidate);

        return {
          id: getCanonicalUserId(candidate),
          _id: candidate._id,
          name: candidate.name,
          major,
          year,
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
        id: userId,
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

    await notificationsCollection.insertOne({
      recipientId: targetId,
      senderId: requesterId,
      senderName: requesterUser?.name ?? "Someone",
      type: "connection_request",
      refId: requesterId,
      read: false,
      createdAt: now,
      updatedAt: now,
    });

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

router.patch("/:id/connect", async (req, res) => {
  const { action } = req.body; // "accept" | "decline"
  const sessionUser = res.locals.authSession?.user;
  const requesterId = req.params.id;

  if (!sessionUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const currentUser = await findUserForSession(sessionUser);
    const currentUserId = getCanonicalUserId(currentUser, sessionUser?.id);

    const request = await connectionRequestsCollection.findOne({
      requesterId,
      targetId: currentUserId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (action === "accept") {
      await connectionRequestsCollection.updateOne(
        { _id: request._id },
        { $set: { status: "accepted", updatedAt: new Date() } },
      );
      await notificationsCollection.insertOne({
        recipientId: requesterId,
        senderId: currentUserId,
        senderName: currentUser?.name ?? "Someone",
        type: "connection_accepted",
        refId: currentUserId,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return res.json({ status: "accepted" });
    } else {
      await connectionRequestsCollection.deleteOne({ _id: request._id });
      return res.json({ status: "declined" });
    }
  } catch (error) {
    console.error("Error handling connection action:", error);
    return res.status(500).json({ error: "Failed to process connection action" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await findUserByAnyId(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const profile = await findProfileForUser(user, id);

    return res.json({
      id: getCanonicalUserId(user, id),
      _id: user._id,
      name: user.name,
      email: user.email,
      major: profile?.major ?? user.major,
      year: profile?.year ?? user.year,
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
  const sessionUser = res.locals.authSession?.user;
  const userId = sessionUser?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const normalizedMajor = typeof major === "string" ? major.trim() : "";
  const normalizedYear = typeof year === "string" ? year.trim() : String(year ?? "").trim();

  if (!normalizedMajor || !normalizedYear) {
    return res.status(400).json({ error: "Major and year are required" });
  }

  const now = new Date();
  const nextProfile = {
    userId,
    major: normalizedMajor,
    year: normalizedYear,
    updatedAt: now,
  };

  const user = await findUserForSession(sessionUser);

  await profilesCollection.updateOne(
    { userId },
    {
      $set: nextProfile,
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  if (user?._id) {
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          major: normalizedMajor,
          year: normalizedYear,
          updatedAt: now,
        },
      },
    );
  }

  const savedProfile = await findProfileForUser(user, userId);

  return res.json({
    message: "Profile updated successfully",
    profile: savedProfile,
    user: {
      ...sessionUser,
      major: normalizedMajor,
      year: normalizedYear,
    },
  });
});

export default router;
