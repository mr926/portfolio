// Runs at container startup via entrypoint.sh
// Creates default admin user if none exists, with a random one-time password
const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const client = createClient({ url: process.env.DATABASE_URL });

async function main() {
  const result = await client.execute("SELECT COUNT(*) as count FROM AdminUser");
  const count = Number(result.rows[0].count);

  if (count === 0) {
    // Generate a random 16-character password (no ambiguous chars)
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";
    const password = Array.from(crypto.randomBytes(16))
      .map((b) => chars[b % chars.length])
      .join("");

    const hashed = await bcrypt.hash(password, 12);
    const id = `admin_${Date.now()}`;
    const now = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO AdminUser (id, username, password, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?)`,
      args: [id, "admin", hashed, now, now],
    });

    console.log("==========================================================");
    console.log("  First-time setup: default admin account created.");
    console.log("  Username: admin");
    console.log(`  Password: ${password}`);
    console.log("  Please change the password after first login.");
    console.log("==========================================================");
  } else {
    console.log("Admin user already exists, skipping.");
  }
}

main()
  .catch((e) => { console.error("Seed error:", e.message); process.exit(1); })
  .finally(() => client.close());
