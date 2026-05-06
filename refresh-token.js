/**
 * refresh-token.js
 * Fetches a fresh access token from the evaluation service and updates
 * both .env (backend) and notification_app_fe/.env.local (frontend).
 *
 * Usage: node refresh-token.js
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const AUTH_URL = "http://20.207.122.201/evaluation-service/auth";

const credentials = {
  email: "peri.adityagoutam009@gmail.com",
  name: "PERI ADITYA GOUTAM",
  mobileNo: "9381735639",
  githubUsername: "AGMaster009",
  rollNo: "CB.SC.P2CSE25029",
  accessCode: "PTBMmQ",
  clientID: "e69d21c3-d242-482d-96d4-aa72e02b5879",
  clientSecret: "ydYVfwcHNfbebKtQ",
};

function updateEnvFile(filePath, token) {
  let content = "";
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf-8");
    // Remove existing token lines
    content = content
      .split("\n")
      .filter((line) => !line.startsWith("ACCESS_TOKEN=") && !line.startsWith("NEXT_PUBLIC_ACCESS_TOKEN="))
      .join("\n")
      .trimEnd();
  }

  const isNextEnv = filePath.includes("env.local");
  const newLines = isNextEnv
    ? `\nACCESS_TOKEN=${token}\nNEXT_PUBLIC_ACCESS_TOKEN=${token}\n`
    : `\nACCESS_TOKEN=${token}\n`;

  fs.writeFileSync(filePath, content + newLines, "utf-8");
  console.log(`  ✔ Updated: ${path.relative(process.cwd(), filePath)}`);
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Auth failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log("\n🔄  Refreshing access token...\n");

  try {
    const result = await post(AUTH_URL, credentials);
    const token = result.access_token;

    if (!token) throw new Error("No access_token in response.");

    const rootEnv = path.join(__dirname, ".env");
    const feEnv = path.join(__dirname, "notification_app_fe", ".env.local");

    updateEnvFile(rootEnv, token);
    updateEnvFile(feEnv, token);

    console.log("\n✅  Token refreshed successfully!");
    console.log("    Restart your servers to pick up the new token.\n");
  } catch (err) {
    console.error("\n❌  Token refresh failed:", err.message, "\n");
    process.exit(1);
  }
}

main();
