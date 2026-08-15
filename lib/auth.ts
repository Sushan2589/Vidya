import db from "./db";
import bcrypt from "bcryptjs";

type AdminUserRow = {
  password_hash: string;
};

// DB-backed credential check. Only ever imported from route handlers /
// server actions — never from middleware.
export async function verifyCredentials(
  username: string,
  password: string
) {
  const result = await db.execute({
    sql: `
      SELECT password_hash
      FROM admin_users
      WHERE username = ?
    `,
    args: [username],
  });

  const user = result.rows[0];

  if (!user) {
    // Still run a hash comparison so response time doesn't leak whether
    // the username exists.
    await bcrypt.compare(
      password,
      "$2b$12$00000000000000000000000000000000000000000000000000000"
    );
    return false;
  }

  const passwordHash = String(user.password_hash);

  return bcrypt.compare(password, passwordHash);
}

export {
  createSession,
  destroySession,
  getSession,
  verifySessionToken,
  SESSION_COOKIE,
} from "./session";