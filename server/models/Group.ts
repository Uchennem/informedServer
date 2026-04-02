import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    posts: {
      type: [Schema.Types.ObjectId],
      ref: "Post",
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export type GroupDocument = InferSchemaType<typeof groupSchema>;

const Group =
  (mongoose.models.Group as Model<GroupDocument>) ||
  mongoose.model<GroupDocument>("Group", groupSchema);

export default Group;
