import { createAuthClient } from "better-auth/client";

const configuredAuthBaseURL = (import.meta.env.PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const isAbsoluteHttpUrl = /^https?:\/\//i.test(configuredAuthBaseURL);

if (configuredAuthBaseURL && !isAbsoluteHttpUrl) {
  throw new Error(
    `Invalid PUBLIC_API_BASE_URL: "${configuredAuthBaseURL}". Use an absolute URL such as "http://localhost:3000".`,
  );
}

const authBaseURL = configuredAuthBaseURL || fallbackOrigin;

export const authClient = createAuthClient(
  authBaseURL
    ? {
        baseURL: authBaseURL,
      }
    : undefined,
);

export const { signUp, signIn, signOut, useSession } = authClient;
