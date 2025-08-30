// api/bridge.js
const { createOrUpdateFile, createPullRequest } = require("../utils/github");
const { callMammouth } = require("../utils/mammouth");

const DEFAULT_BASE = process.env.DEFAULT_BASE || "main";

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        if (!data) return resolve({});
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  // Simple header-based auth
  const secret = req.headers["x-bridge-secret"];
  if (!secret || secret !== process.env.BRIDGE_SECRET) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  let body;
  try {
    // Next/Vercel sometimes give parsed body; fall back to manual parse
    body = req.body && Object.keys(req.body).length ? req.body : await parseJsonBody(req);
  } catch (err) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Invalid JSON body" }));
    return;
  }

  const { owner, repo, path, instruction, mode = "pr", base = DEFAULT_BASE } = body;
  if (!owner || !repo || !path || !instruction) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Missing parameters. Required: owner, repo, path, instruction" }));
    return;
  }

  try {
    // 1) Appel à Mammouth
    const mammouthResult = await callMammouth(instruction);

    // mammouthResult peut être string ou objet ; on tente d'extraire le texte proprement
    let newContent;
    if (typeof mammouthResult === "string") {
      newContent = mammouthResult;
    } else if (mammouthResult?.output) {
      // cas courant : { output: "..." } ou { output: [ { text: "..." } ] }
      if (Array.isArray(mammouthResult.output)) {
        newContent = mammouthResult.output.map((o) => (o.text ? o.text : JSON.stringify(o))).join("\n\n");
      } else if (typeof mammouthResult.output === "string") {
        newContent = mammouthResult.output;
      } else {
        newContent = JSON.stringify(mammouthResult.output);
      }
    } else if (mammouthResult?.text) {
      newContent = mammouthResult.text;
    } else {
      // fallback
      newContent = JSON.stringify(mammouthResult, null, 2);
    }

    // 2) GitHub: branch, update file, PR or commit direct
    if (mode === "pr") {
      const branchName = `mammouth/${Date.now()}`;
      const prUrl = await createPullRequest(owner, repo, path, newContent, branchName, base, `Update ${path} via mammouth`);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, pr: prUrl }));
      return;
    } else {
      // direct commit to base branch (use with caution)
      await createOrUpdateFile(owner, repo, path, newContent, base, `Update ${path} via mammouth (direct)`);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
      return;
    }
  } catch (err) {
    console.error("bridge error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err.message || String(err) }));
  }
};
