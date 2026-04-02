import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    major: {
      type: String,
      trim: true,
      default: "",
    },
    year: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    interests: {
      type: [String],
      default: [],
    },
    interestTags: {
      type: [String],
      default: [],
    },
  },
  {
    collection: "user",
    timestamps: true,
  },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

const User =
  (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", userSchema);

export default User;
