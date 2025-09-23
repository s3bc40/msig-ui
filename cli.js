#!/usr/bin/env node
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

// Build if .next is missing
import fs from "fs";
if (!fs.existsSync(".next")) {
  console.log("Building app...");
  execSync("pnpm build", { stdio: "inherit" });
}

// Start production server
console.log("Starting app in production mode...");
execSync("pnpm start", { stdio: "inherit" });
