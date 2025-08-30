// api/bridge.js
const crypto = require("crypto");
const { createOrUpdateFile, createPullRequest } = require("../utils/github");
const { callMammouth } = require("../utils/mammouth");

const DEFAULT_BASE = process.env.DEFAULT_BASE || "main";

// helper pour parser body si nécessaire (streams)
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

// timing-safe comparison qui gère longueurs différentes
function safeEqualStrings(a = "", b = "") {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  // pour utiliser timingSafeEqual, on doit égaliser les longueurs
  if (aBuf.length !== bBuf.length) {
    const len = Math.max(aBuf.length, bBuf.length);
    const aPadded = Buffer.concat([aBuf, Buffer.alloc(len - aBuf.length)], len);
    const bPadded = Buffer.concat([bBuf, Buffer.alloc(len - bBuf.length)], len);
    return crypto.timingSafeEqual(aPadded, bPadded);
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// Validation HMAC (x-bridge-signature) -> header format attendu:
// x-bridge-signature: t=1630000000,v1=<hex_signature>
// signature = HMAC_SHA256( BRIDGE_SECRET, `${timestamp}.${rawBody}` )
// timestamp must be within allowed window (default 5min)
function validateHmacSignature(headerValue, rawBody, secret, windowSecs = 300) {
  if (!headerValue) return false;
  const parts = headerValue.split(",");
  let tPart = parts.find((p) => p.trim().startsWith("t="));
  let v1Part = parts.find((p) => p.trim().startsWith("v1="));
  if (!tPart || !v1Part) return false;
  const timestamp = Number(tPart.split("=")[1]);
  const signature = v1Part.split("=")[1];

  if (!timestamp || !signature) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > windowSecs) {
    // outdated request
    return false;
  }

  const payload = `${timestamp}.${rawBody || ""}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return safeEqualStrings(hmac, signature);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }

  const expectedSecret = process.env.BRIDGE_SECRET;
  if (!expectedSecret) {
    console.error("BRIDGE_SECRET non défini dans les variables d'environnement.");
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Server misconfiguration" }));
    return;
  }

  // Récupérer raw body (string) pour la validation HMAC si nécessaire
  let rawBodyString = "";
  if (req.body && Object.keys(req.body).length) {
    // si Next/Vercel a déjà parsé, on recrée une string (délicate si l'ordre des champs diffère)
    try {
      rawBodyString = JSON.stringify(req.body);
    } catch (e) {
      rawBodyString = "";
    }
  } else {
    // on lit manuellement le stream
    try {
      // parseJsonBody renvoie l'objet; on veut aussi la raw string
      rawBodyString = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => resolve(data || ""));
        req.on("error", reject);
      });
    } catch (err) {
      rawBodyString = "";
    }
  }

  // Auth: premièrement, essayer la signature HMAC (plus sûre)
  const signatureHeader = req.headers["x-bridge-signature"];
  let provided = req.headers["x-bridge-secret"] || (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");

  let authorized = false;
  try {
    if (signatureHeader) {
      // validate HMAC
      authorized = validateHmacSignature(signatureHeader, rawBodyString, expectedSecret);
    } else if (provided) {
      // fallback: comparaison timing-safe avec le secret brut
      authorized = safeEqualStrings(provided, expectedSecret);
    }
  } catch (e) {
    console.error("Erreur validation signature:", e);
    authorized = false;
  }

  if (!authorized) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  // Parse JSON body into object (try existing parsed body first)
  let body;
  try {
    body = req.body && Object.keys(req.body).length ? req.body : (rawBodyString ? JSON.parse(rawBodyString) : {});
  } catch (err) {
    // as a fallback, use parseJsonBody which we already attempted, but keep this for clarity
    try {
      body = await parseJsonBody(req);
    } catch (e) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Invalid JSON body" }));
      return;
    }
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

    // extraction flexible du texte retourné par Mammouth
    let newContent;
    if (typeof mammouthResult === "string") {
      newContent = mammouthResult;
    } else if (mammouthResult?.output) {
      if (Array.isArray(mammouthResult.output)) {
        newContent = mammouthResult.output.map((o) => (o && o.text ? o.text : JSON.stringify(o))).join("\n\n");
      } else if (typeof mammouthResult.output === "string") {
        newContent = mammouthResult.output;
      } else {
        newContent = JSON.stringify(mammouthResult.output, null, 2);
      }
    } else if (mammouthResult?.text) {
      newContent = mammouthResult.text;
    } else {
      newContent = JSON.stringify(mammouthResult, null, 2);
    }

    // 2) GitHub actions: PR or direct commit
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
