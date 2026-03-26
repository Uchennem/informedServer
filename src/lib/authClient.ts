import { createAuthClient } from "better-auth/client";

const authBaseURL = (import.meta.env.PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

export const authClient = createAuthClient(
  authBaseURL
    ? {
        baseURL: authBaseURL,
      }
    : undefined,
);

export const { signUp, signIn, signOut, useSession } = authClient;
