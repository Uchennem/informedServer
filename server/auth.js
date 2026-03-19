import "dotenv/config";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import process from "node:process";

const MONGODB_URI = process.env.MONGODB_URI;
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable.");
}

if (!BETTER_AUTH_SECRET) {
  throw new Error("Please define the BETTER_AUTH_SECRET environment variable.");
}

const mongoClient = new MongoClient(MONGODB_URI);
const database = mongoClient.db();

export const auth = betterAuth({
  database: mongodbAdapter(database, { client: mongoClient }),
  secret: BETTER_AUTH_SECRET,
});

export default auth;