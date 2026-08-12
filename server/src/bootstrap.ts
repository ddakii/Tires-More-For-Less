import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "./lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");

export async function ensureDatabase() {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  if (dbUrl.startsWith("file:")) {
    const rel = dbUrl.replace(/^file:/, "");
    const dbPath = path.isAbsolute(rel) ? rel : path.resolve(serverRoot, "prisma", rel.replace(/^\.\//, ""));
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  console.log("Applying database schema...");
  execSync("npx prisma db push --skip-generate", {
    cwd: serverRoot,
    stdio: "inherit",
    env: process.env,
  });

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("Seeding demo data...");
    execSync("npx tsx prisma/seed.ts", {
      cwd: serverRoot,
      stdio: "inherit",
      env: process.env,
    });
  } else {
    console.log(`Database ready (${userCount} admin user(s)).`);
  }
}
