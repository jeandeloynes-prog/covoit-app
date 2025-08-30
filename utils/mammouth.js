// utils/mammouth.js
// Utilise fetch natif (Node 20+)
async function callMammouth(instruction) {
  const url = process.env.MAMMOUTH_API_URL;
  const key = process.env.MAMMOUTH_API_KEY;
  if (!url) throw new Error("MAMMOUTH_API_URL not configured");
  if (!key) throw new Error("MAMMOUTH_API_KEY not configured");

  // Body générique — adaptez selon la doc Mammouth si nécessaire
  const body = {
    prompt: instruction,
    max_tokens: 1200
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(body),
    // timeout non natif ; Vercel / Node gère la durée via maxDuration
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Mammouth API error: ${resp.status} - ${t}`);
  }

  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    // si la réponse n'est pas JSON, renvoyer le texte brut
    return text;
  }
}

module.exports = { callMammouth };
