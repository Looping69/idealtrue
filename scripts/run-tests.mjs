import { spawnSync } from "node:child_process";

function run(command) {
  const result = process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", command], {
        stdio: "inherit",
      })
    : spawnSync(command, {
        stdio: "inherit",
        shell: true,
      });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(`${value || ""}`.trim().toLowerCase());
}

run("npm run test:unit");
run("npm run test:ui");

if (isTruthy(process.env.IDEAL_STAY_RUN_LIVE_SMOKE)) {
  run("npm run smoke:live");
} else {
  console.log(
    "Skipping live smoke. Set IDEAL_STAY_RUN_LIVE_SMOKE=true to probe a real deployment through the same-origin proxy.",
  );
}
