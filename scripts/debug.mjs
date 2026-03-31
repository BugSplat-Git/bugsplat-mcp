import { config } from "dotenv";
import { spawn } from "child_process";

config();

const database = process.env.BUGSPLAT_DATABASE;
const clientId = process.env.BUGSPLAT_CLIENT_ID;
const clientSecret = process.env.BUGSPLAT_CLIENT_SECRET;

if (!database || !clientId || !clientSecret) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const envVars = [
  `BUGSPLAT_DATABASE=${database}`,
  `BUGSPLAT_CLIENT_ID=${clientId}`,
  `BUGSPLAT_CLIENT_SECRET=${clientSecret}`,
];

const args = [
  "@modelcontextprotocol/inspector",
  ...envVars.reduce((acc, env) => [...acc, "-e", env], []),
  "node",
  "--inspect-brk",
  "build/index.js",
];

const inspector = spawn("npx", args, {
  stdio: "inherit",
  shell: true,
});

inspector.on("error", (error) => {
  console.error("Failed to start inspector:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  inspector.kill("SIGINT");
});

process.on("SIGTERM", () => {
  inspector.kill("SIGTERM");
});
