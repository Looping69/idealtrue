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

run("npm run test:unit");
run("npm run test:ui");
