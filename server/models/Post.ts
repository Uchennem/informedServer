import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const postSchema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    maxAttendees: {
      type: Number,
      default: 0,
      min: 0,
    },
    rsvps: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export type PostDocument = InferSchemaType<typeof postSchema>;

const Post =
  (mongoose.models.Post as Model<PostDocument>) ||
  mongoose.model<PostDocument>("Post", postSchema);

export default Post;
