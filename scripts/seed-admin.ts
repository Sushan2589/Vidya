// Run with: bun run scripts/seed-admin.ts <username> <password>
// Creates the admin account if it doesn't exist, or resets the password
// if it does. This is the only way to provision the single admin user —
// there is no sign-up page on purpose.

import db from "../lib/db";

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error("Usage: bun run scripts/seed-admin.ts <username> <password>");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const passwordHash = await Bun.password.hash(password, {
  algorithm: "bcrypt",
  cost: 12,
});

const existing = db
  .query("SELECT id FROM admin_users WHERE username = $username")
  .get({ $username: username });

if (existing) {
  db.query(
    "UPDATE admin_users SET password_hash = $hash WHERE username = $username"
  ).run({ $hash: passwordHash, $username: username });
  console.log(`Updated password for "${username}".`);
} else {
  db.query(
    "INSERT INTO admin_users (username, password_hash, created_at) VALUES ($username, $hash, $now)"
  ).run({ $username: username, $hash: passwordHash, $now: Date.now() });
  console.log(`Created admin user "${username}".`);
}
