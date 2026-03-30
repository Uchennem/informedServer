import { Router } from "express";
import { groupMembershipsCollection } from "../auth.js";

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

	res.json(
		baseGroups.map((group) => ({
			...group,
			memberCount: group.memberCount + (membershipCounts.get(group.id) ?? 0),
			isMember: membershipSet.has(group.id),
		})),
	);
});

router.post("/:groupId/join", async (req, res) => {
	const { groupId } = req.params;
	const userId = res.locals.authSession?.user?.id;
	const group = baseGroups.find((entry) => entry.id === groupId);

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	if (!group) {
		return res.status(404).json({ error: "Group not found" });
	}

	const existingMembership = await groupMembershipsCollection.findOne({ groupId, userId });

	if (existingMembership) {
		const memberCount = group.memberCount + (await groupMembershipsCollection.countDocuments({ groupId }));

		return res.json({
			message: "Already joined",
			joined: true,
			groupId,
			memberCount,
		});
	}

	await groupMembershipsCollection.insertOne({
		groupId,
		userId,
		createdAt: new Date(),
	});

	const memberCount = group.memberCount + (await groupMembershipsCollection.countDocuments({ groupId }));

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
	const group = baseGroups.find((entry) => entry.id === groupId);

	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	if (!group) {
		return res.status(404).json({ error: "Group not found" });
	}

	await groupMembershipsCollection.deleteOne({ groupId, userId });

	const memberCount = group.memberCount + (await groupMembershipsCollection.countDocuments({ groupId }));

	return res.json({
		message: "Left group successfully",
		joined: false,
		groupId,
		memberCount,
	});
});

export default router;
