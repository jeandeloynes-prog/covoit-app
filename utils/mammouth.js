// utils/mammouth.js

/**
 * Appelle l'API Mammouth et retourne { content: string }
 * Adapte le payload ou l'extraction selon la doc Mammouth.
 */
async function callMammouth({ instruction, owner, repo, path }) {
  const apiKey = process.env.MAMMOUTH_API_KEY;
  const apiUrl = process.env.MAMMOUTH_API_URL;
  if (!apiKey) throw new Error("MAMMOUTH_API_KEY manquant");
  if (!apiUrl) throw new Error("MAMMOUTH_API_URL manquant");

  // Exemple générique: many providers accept "prompt" and return { choices: [{ text }]} or { content }
  const payload = {
    prompt: buildPrompt({ instruction, owner, repo, path }),
    // tu peux ajouter des options si la doc le préconise
    // e.g. model: "x", temperature: 0.3
  };

  const resp = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Mammouth API ${resp.status}: ${text || resp.statusText}`);
  }

  const data = await resp.json().catch(() => ({}));

  // Essais d’extraction robustes
  const content =
    data.content ||
    (data.choices && data.choices[0] && (data.choices[0].text || data.choices[0].message?.content)) ||
    data.output ||
    data.result ||
    "";

  if (!content || typeof content !== "string") {
    throw new Error("Réponse Mammouth sans contenu textuel exploitable");
  }

  return { content };
}

function buildPrompt({ instruction, owner, repo, path }) {
  return [
    `Tu es un assistant qui édite des fichiers dans un repo GitHub.`,
    `Dépôt: ${owner}/${repo}`,
    `Fichier ciblé: ${path}`,
    `Instruction: ${instruction}`,
    `Produit uniquement le contenu final complet du fichier, sans balises ni explications.`
  ].join("\n");
}

module.exports = { callMammouth };
