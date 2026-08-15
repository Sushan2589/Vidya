import db from "./db";

type AdminUserRow = { password_hash: string };

// DB-backed credential check. Only ever imported from route handlers /
// server actions (Node/Bun runtime) — never from middleware.
export async function verifyCredentials(username: string, password: string) {
  const user = db
    .query("SELECT password_hash FROM admin_users WHERE username = $username")
    .get({ $username: username }) as AdminUserRow | null;

  if (!user) {
    // Still run a hash comparison so response time doesn't leak whether
    // the username exists.
    await Bun.password.verify(password, "$2b$12$" + "0".repeat(53));
    return false;
  }

  return Bun.password.verify(password, user.password_hash);
}

export { createSession, destroySession, getSession, verifySessionToken, SESSION_COOKIE } from "./session";
