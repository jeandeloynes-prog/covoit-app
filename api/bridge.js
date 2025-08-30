// api/bridge.js
const { createOrUpdateFile, createPullRequest, ensureBranchFromBase } = require("../utils/github");
const { callMammouth } = require("../utils/mammouth");

const DEFAULT_BASE = process.env.DEFAULT_BASE || "main";

/**
 * Body attendu (JSON):
 * {
 *   "owner": "monCompteOuOrg",
 *   "repo": "monRepo",
 *   "path": "docs/README.md",
 *   "instruction": "Rends ce README plus pro et concis",
 *   "mode": "pr" | "direct",          // défaut: "pr"
 *   "commitMessage": "docs: améliore README" // optionnel
 * }
 *
 * Auth: header x-bridge-secret = BRIDGE_SECRET
 */
module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const secret = req.headers["x-bridge-secret"];
    if (!secret || secret !== process.env.BRIDGE_SECRET) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = await readJson(req);
    const { owner, repo, path, instruction, mode = "pr", commitMessage } = body || {};

    if (!owner || !repo || !path || !instruction) {
      res.status(400).json({ error: "owner, repo, path, instruction sont requis" });
      return;
    }

    // 1) Obtenir contenu depuis Mammouth (texte généré)
    const generated = await callMammouth({ instruction, owner, repo, path });
    if (!generated || !generated.content) {
      res.status(502).json({ error: "Aucun contenu généré par Mammouth" });
      return;
    }

    const content = generated.content;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const branch = `mammouth/${ts}`;
    const message = commitMessage || `chore(mammouth): update ${path}`;

    if (mode === "direct") {
      // Commit direct sur la branche par défaut
      await createOrUpdateFile({ owner, repo, branch: DEFAULT_BASE, path, content, message });
      res.status(200).json({ ok: true, mode: "direct", commitOn: DEFAULT_BASE });
      return;
    }

    // 2) Créer branche depuis DEFAULT_BASE
    await ensureBranchFromBase({ owner, repo, base: DEFAULT_BASE, branch });

    // 3) Commit sur la branche
    await createOrUpdateFile({ owner, repo, branch, path, content, message });

    // 4) Ouvrir PR
    const pr = await createPullRequest({
      owner,
      repo,
      head: branch,
      base: DEFAULT_BASE,
      title: message,
      body: `Automated change via bridge. Instruction: ${instruction}`
    });

    res.status(200).json({ ok: true, mode: "pr", pr: pr.html_url });
  } catch (err) {
    console.error("bridge error:", err);
    res.status(500).json({ error: "Internal error", detail: String(err && err.message || err) });
  }
};

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
