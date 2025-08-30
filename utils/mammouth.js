import fetch from "node-fetch";

/**
 * Appelle l'API Mammouth.
 * - MAMMOUTH_API_KEY : clé privée fournie par mammouth
 * - MAMMOUTH_API_URL : endpoint configurable (ex: https://api.mammouth.ai/v1/generate)
 *
 * Retourne soit une chaîne soit un objet JSON suivant la réponse de l'API.
 */
export async function callMammouth(instruction) {
  const url = process.env.MAMMOUTH_API_URL;
  if (!url) throw new Error("MAMMOUTH_API_URL not configured");

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.MAMMOUTH_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      // Corps générique — adaptez selon la doc Mammouth
      prompt: instruction,
      max_tokens: 1200
    })
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Mammouth API error: ${resp.status} - ${t}`);
  }

  // essaie JSON puis texte
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}
