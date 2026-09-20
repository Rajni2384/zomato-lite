// db/setup.mjs — applies schema.sql and seed.sql to the Neon database.
// Run with: npm run db:setup
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

// Load DATABASE_URL from .env.local (kept out of Git on purpose)
process.loadEnvFile(".env.local");

const sql = neon(process.env.DATABASE_URL);

// Split on ";" so each statement runs on its own
const statements = (text) =>
  text
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

console.log("→ Applying schema...");
// Wipe first so the setup can be re-run cleanly (schema.sql itself stays pristine)
for (const stmt of [
  "DROP TABLE IF EXISTS reviews",
  "DROP TABLE IF EXISTS restaurants",
]) {
  await sql.query(stmt);
}
for (const stmt of statements(await readFile(new URL("./schema.sql", import.meta.url), "utf8"))) {
  await sql.query(stmt);
}
console.log("→ Schema applied.");

console.log("→ Seeding data...");
for (const stmt of statements(await readFile(new URL("./seed.sql", import.meta.url), "utf8"))) {
  await sql.query(stmt);
}
console.log("→ Seed applied.");

// Show what we created
const restaurants = await sql.query("SELECT * FROM restaurants ORDER BY id");
const reviews = await sql.query("SELECT * FROM reviews ORDER BY id");

console.log("\n=== restaurants table ===");
console.table(restaurants);
console.log("\n=== reviews table ===");
console.table(reviews);