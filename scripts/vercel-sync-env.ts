import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

import { parse } from "dotenv";

const envFilePath = ".env.local";

const normalizeEnvFile = (content: string) =>
  content
    .split(/\r?\n/)
    .map((line) => line.trimStart())
    .join("\n");

const main = async () => {
  const targetEnvironment = process.argv[2] as "production" | "preview" | "development" | undefined;

  if (targetEnvironment && !["production", "preview", "development"].includes(targetEnvironment)) {
    throw new Error("Environment must be production, preview, or development.");
  }

  if (targetEnvironment === "development") {
    throw new Error("Development must be synced separately.");
  }

  const rawEnvFile = await readFile(envFilePath, "utf8");
  const envEntries = Object.entries(parse(normalizeEnvFile(rawEnvFile)));

  if (envEntries.length === 0) {
    console.log(`No variables found in ${envFilePath}.`);
    return;
  }

  const targets = targetEnvironment ? [targetEnvironment] : ["production", "preview"];

  for (const [name, value] of envEntries) {
    for (const target of targets) {
      const result = spawnSync(
        "vercel",
        ["env", "add", name, target, "--value", value, "--yes", "--force"],
        {
          encoding: "utf8",
          stdio: "inherit",
        }
      );

      if (result.status !== 0) {
        throw new Error(`Failed to sync ${name} to ${target}`);
      }
    }
  }

  const scope = targetEnvironment ?? "all environments";
  console.log(`Synced ${envEntries.length} variables from ${envFilePath} to Vercel (${scope}).`);
};

await main();
