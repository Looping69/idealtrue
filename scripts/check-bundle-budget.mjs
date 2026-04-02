import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const assetsDir = path.join(repoRoot, "dist", "assets");
const defaultBudgetBytes = 900_000;
const configuredBudgetBytes = Number.parseInt(`${process.env.IDEAL_STAY_MAX_BUNDLE_BYTES || defaultBudgetBytes}`, 10);

if (!fs.existsSync(assetsDir)) {
  console.error("Bundle budget check failed. dist/assets does not exist.");
  process.exit(1);
}

const jsAssets = fs.readdirSync(assetsDir)
  .filter((entry) => entry.endsWith(".js"))
  .map((entry) => {
    const absolutePath = path.join(assetsDir, entry);
    return {
      file: entry,
      size: fs.statSync(absolutePath).size,
    };
  })
  .sort((left, right) => right.size - left.size);

if (jsAssets.length === 0) {
  console.error("Bundle budget check failed. No JavaScript assets were found in dist/assets.");
  process.exit(1);
}

const largestAsset = jsAssets[0];
if (largestAsset.size > configuredBudgetBytes) {
  console.error(
    `Bundle budget check failed. ${largestAsset.file} is ${largestAsset.size} bytes, exceeding the ${configuredBudgetBytes} byte budget.`,
  );
  process.exit(1);
}

console.log(
  `Bundle budget check passed. Largest JS asset ${largestAsset.file} is ${largestAsset.size} bytes (budget ${configuredBudgetBytes}).`,
);
