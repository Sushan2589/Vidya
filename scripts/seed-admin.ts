// Run with: bun run scripts/seed-admin.ts <username> <password>
// Creates the admin account if it doesn't exist, or resets the password
// if it does. This is the only way to provision the single admin user —
// there is no sign-up page on purpose.

import db from "../lib/db";
import bcrypt from "bcryptjs";

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error("Usage: bun run scripts/seed-admin.ts <username> <password>");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);

const existingResult = await db.execute({
  sql: "SELECT id FROM admin_users WHERE username = ?",
  args: [username],
});

const existing = existingResult.rows[0];

if (existing) {
  await db.execute({
    sql: `
      UPDATE admin_users
      SET password_hash = ?
      WHERE username = ?
    `,
    args: [passwordHash, username],
  });

  console.log(`Updated password for "${username}".`);
} else {
  await db.execute({
    sql: `
      INSERT INTO admin_users (
        username,
        password_hash,
        created_at
      )
      VALUES (?, ?, ?)
    `,
    args: [username, passwordHash, Date.now()],
  });

  console.log(`Created admin user "${username}".`);
}