import { Router } from "express";
import { groupMembershipsCollection, groupsCollection } from "../auth.js";

const router = Router();

const baseGroups = [
	{
		id: "cs-club",
		name: "Computer Science Club",
		description: "Weekly meetups for coding practice, interview prep, and hackathon planning.",
		category: "Academic",
		memberCount: 42,
	},
	{
		id: "design-lab",
		name: "Design Lab",
		description: "A collaborative space for students exploring UI, UX, and product design.",
		category: "Creative",
		memberCount: 28,
	},
	{
		id: "founders-forum",
		name: "Founders Forum",
		description: "Student founders and builders sharing ideas, demos, and startup resources.",
		category: "Entrepreneurship",
		memberCount: 18,
	},
];

async function getMembershipCounts() {
	const membershipCounts = await groupMembershipsCollection
		.aggregate([
			{ $group: { _id: "$groupId", count: { $sum: 1 } } },
		])
		.toArray();

	return new Map(membershipCounts.map((entry) => [entry._id, entry.count]));
}

router.get("/", async (req, res) => {
	const userId = res.locals.authSession?.user?.id;
	const membershipCounts = await getMembershipCounts();
	const memberships = userId
		? await groupMembershipsCollection.find({ userId }).toArray()
		: [];
	const membershipSet = new Set(memberships.map((entry) => entry.groupId));

	const dbGroups = await groupsCollection.find({}).sort({ createdAt: -1 }).toArray();
	const serializedDbGroups = dbGroups.map((g) => ({
		id: g._id.toString(),
		name: g.name,
		description: g.description ?? '',
		category: g.category ?? 'General',
		tags: g.tags ?? [],
		memberCount: membershipCounts.get(g._id.toString()) ?? 1,
		isMember: membershipSet.has(g._id.toString()),
	}));

	const hardcodedGroups = baseGroups.map((group) => ({
		...group,
		memberCount: group.memberCount + (membershipCounts.get(group.id) ?? 0),
		isMember: membershipSet.has(group.id),
	}));

	res.json([...serializedDbGroups, ...hardcodedGroups]);
});

router.post("/", async (req, res) => {
	const { name, description, tags } = req.body;
	if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
	const userId = res.locals.authSession?.user?.id;
	if (!userId) return res.status(401).json({ error: "Unauthorized" });
	const now = new Date();
	try {
		const result = await groupsCollection.insertOne({
			name: name.trim(),
			description: description?.trim() ?? '',
			tags: Array.isArray(tags) ? tags : [],
			createdBy: userId,
			members: [userId],
			createdAt: now,
			updatedAt: now,
		});
		await groupMembershipsCollection.insertOne({
			groupId: result.insertedId.toString(),
			userId,
			joinedAt: now,
		});
		return res.status(201).json({
			id: result.insertedId.toString(),
			name: name.trim(),
			description: description?.trim() ?? '',
			tags: Array.isArray(tags) ? tags : [],
			memberCount: 1,
			isMember: true,
		});
	} catch (error) {
		console.error("[POST /api/groups]", error);
		return res.status(500).json({ error: "Failed to create group" });
	}
});

router.post("/:groupId/join", async (req, res) => {
	const { groupId } = req.params;
	const userId = res.locals.authSession?.user?.id;

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const hardcodedGroup = baseGroups.find((entry) => entry.id === groupId);

	// Check if it's a DB group
	const { ObjectId } = await import("mongodb");
	let dbGroup = null;
	if (!hardcodedGroup && ObjectId.isValid(groupId)) {
		dbGroup = await groupsCollection.findOne({ _id: new ObjectId(groupId) });
	}

	if (!hardcodedGroup && !dbGroup) {
		return res.status(404).json({ error: "Group not found" });
	}

	const existingMembership = await groupMembershipsCollection.findOne({ groupId, userId });

	if (existingMembership) {
		const memberCount = (hardcodedGroup?.memberCount ?? 1) + (await groupMembershipsCollection.countDocuments({ groupId }));
		return res.json({ message: "Already joined", joined: true, groupId, memberCount });
	}

	await groupMembershipsCollection.insertOne({ groupId, userId, createdAt: new Date() });

	const memberCount = (hardcodedGroup?.memberCount ?? 1) + (await groupMembershipsCollection.countDocuments({ groupId }));

	return res.status(201).json({
		message: "Joined group successfully",
		joined: true,
		groupId,
		memberCount,
	});
});

router.delete("/:groupId/leave", async (req, res) => {
	const { groupId } = req.params;
	const userId = res.locals.authSession?.user?.id;

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const hardcodedGroup = baseGroups.find((entry) => entry.id === groupId);

	const { ObjectId } = await import("mongodb");
	let dbGroup = null;
	if (!hardcodedGroup && ObjectId.isValid(groupId)) {
		dbGroup = await groupsCollection.findOne({ _id: new ObjectId(groupId) });
	}

	if (!hardcodedGroup && !dbGroup) {
		return res.status(404).json({ error: "Group not found" });
	}

	await groupMembershipsCollection.deleteOne({ groupId, userId });

	const memberCount = (hardcodedGroup?.memberCount ?? 1) + (await groupMembershipsCollection.countDocuments({ groupId }));

	return res.json({
		message: "Left group successfully",
		joined: false,
		groupId,
		memberCount,
	});
});

export default router;
