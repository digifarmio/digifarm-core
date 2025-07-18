#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

const packagePath = path.join(__dirname, "..", "package.json");

function bumpVersion(type = "patch") {
  try {
    // Read current package.json
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    const currentVersion = packageJson.version;

    // Parse current version
    const [major, minor, patch] = currentVersion.split(".").map(Number);

    let newVersion;
    switch (type) {
      case "major":
        newVersion = `${major + 1}.0.0`;
        break;
      case "minor":
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case "patch":
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }

    // Update package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");

    console.log(`✅ Version bumped from ${currentVersion} to ${newVersion}`);
    console.log(`📝 Don't forget to commit the changes:`);
    console.log(`   git add package.json`);
    console.log(`   git commit -m "chore: bump version to ${newVersion}"`);
  } catch (error) {
    console.error("❌ Error bumping version:", error.message);
    process.exit(1);
  }
}

// Get version type from command line arguments
const versionType = process.argv[2] || "patch";

if (!["major", "minor", "patch"].includes(versionType)) {
  console.error("❌ Invalid version type. Use: major, minor, or patch");
  console.error("Usage: node scripts/bump-version.js [major|minor|patch]");
  process.exit(1);
}

bumpVersion(versionType);
