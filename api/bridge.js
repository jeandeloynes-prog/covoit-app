// Serverless endpoint pour Vercel
import fetch from "node-fetch";
import { createOrUpdateFile, createPullRequest } from "../utils/github.js";
import { callMammouth } from "../utils/mammouth.js";

const DEFAULT_BASE = process.env.DEFAULT_BASE || "main";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Auth simple via header
  const secret = req.headers["x-bridge-secret"];
  if (!secret || secret !== process.env.BRIDGE_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let body;
  try {
    body = req.body && Object.keys(req.body).length ? req.body : await parseJson(req);
  } catch (e) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const { owner, repo, path, instruction, mode = "pr", base = DEFAULT_BASE } = body;
  if (!owner || !repo || !path || !instruction) {
    res.status(400).json({ error: "Missing parameters. Required: owner, repo, path, instruction" });
    return;
  }

  try {
    // 1) Appel à l'API Mammouth (URL configurable)
    const mammouthResult = await callMammouth(instruction);
    // newContent : chaîne de caractères
    const newContent = typeof mammouthResult === "string" ? mammouthResult : (mammouthResult.output || mammouthResult.text || JSON.stringify(mammouthResult));

    const branchName = `mammouth/${Date.now()}`;

    if (mode === "pr") {
      const prUrl = await createPullRequest(owner, repo, path, newContent, branchName, base, `Update ${path} via mammouth`);
      res.status(200).json({ ok: true, pr: prUrl });
      return;
    } else {
      // direct commit on base (use with caution)
      await createOrUpdateFile(owner, repo, path, newContent, base, `Update ${path} via mammouth (direct)`);
      res.status(200).json({ ok: true });
      return;
    }
  } catch (err) {
    console.error("bridge error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
}

async function parseJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}
