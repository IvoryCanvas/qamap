// Local-only inspection helper: prints per-flow fixture guidance for the
// pinned bench targets so wording changes can be eyeballed on real repos.
// Reads bench.config.local.json (gitignored); makes no changes to targets.
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateE2ePlan } from "../dist/index.js";

const config = JSON.parse(readFileSync(new URL("../bench.config.local.json", import.meta.url), "utf8"));

function expandHome(value) {
  return value.startsWith("~/") ? path.join(os.homedir(), value.slice(2)) : value;
}

for (const target of config.targets) {
  const plan = await generateE2ePlan(expandHome(target.path), { base: target.base, head: target.head });
  console.log(`### ${target.name}`);
  for (const flow of plan.flows) {
    const readiness = flow.fixtureReadiness;
    if (!readiness || readiness.status === "not-needed") {
      continue;
    }
    console.log(`- flow: ${flow.title}`);
    console.log(`  status: ${readiness.status}`);
    if (readiness.apiEndpoints.length > 0) {
      console.log(`  endpoints: ${readiness.apiEndpoints.slice(0, 4).join(", ")}`);
    }
    if (readiness.nextActions[0]) {
      console.log(`  next: ${readiness.nextActions[0].slice(0, 220)}`);
    }
    for (const insight of readiness.mockInsights ?? []) {
      console.log(
        `  insight: ${insight.file} | exports: ${insight.exports.slice(0, 3).join(",")} | routes: ${insight.handledEndpoints.slice(0, 3).join(",")} | keys: ${insight.sampleKeys.slice(0, 4).join(",")}`,
      );
    }
  }
}
