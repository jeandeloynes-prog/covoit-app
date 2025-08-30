# Mammouth Bridge (Vercel)

Variables d'environnement à définir dans Vercel:
- MAMMOUTH_API_KEY  = (clé fournie par Mammouth, format sk-...)
- MAMMOUTH_API_URL  = URL de l'endpoint (ex: https://api.mammouth.ai/v1/generate) — vérifiez la doc Mammouth
- GITHUB_TOKEN      = Personal Access Token (fine-grained) avec permissions repo (Contents read/write, Pull requests write)
- BRIDGE_SECRET     = chaîne secrète pour protéger l'endpoint (ex: long random string)
- DEFAULT_BASE      = (optionnel) branche par défaut, ex: main

Test curl:
curl -X POST https://<votre-projet>.vercel.app/api/bridge \
  -H "Content-Type: application/json" \
  -H "x-bridge-secret: VOTRE_BRIDGE_SECRET" \
  -d '{
    "owner": "monCompte",
    "repo": "monRepo",
    "path": "README.md",
    "instruction": "Rends ce README plus professionnel et concis.",
    "mode": "pr"
  }'
