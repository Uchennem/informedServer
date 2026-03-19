import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";

export async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.locals.authSession = session;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export default requireAuth;