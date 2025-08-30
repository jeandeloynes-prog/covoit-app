Mammouth → GitHub bridge (Vercel)
================================

But
----
Service serverless qui appelle l'API Mammouth pour générer/éditer du contenu, puis crée une branche + PR sur GitHub avec la modification.

Déploiement (100% en ligne)
---------------------------
1) Créez un nouveau dépôt GitHub et poussez les fichiers du projet.
2) Sur Vercel : connectez votre compte GitHub et importez le dépôt (déploiement automatique).
3) Dans Vercel → Project → Settings → Environment Variables ajoutez :
   - MAMMOUTH_API_KEY  = (clé sk-... fournie par mammouth)
   - MAMMOUTH_API_URL  = (ex: https://api.mammouth.ai/v1/generate)  -- ADAPTEZ selon la doc mammouth
   - GITHUB_TOKEN      = (votre Personal Access Token fine‑grained GitHub)
   - BRIDGE_SECRET     = (une chaîne secrète longue, p.ex. générée)
   - DEFAULT_BASE      = (optionnel, ex: main)

Notes pour le PAT GitHub (fine‑grained)
--------------------------------------
- Repository access : seulement les repos nécessaires.
- Permissions minimales recommandées :
  - Contents -> Read & write
  - Pull requests -> Write
- Expiration : 30 ou 90 jours selon votre politique.

Utilisation
-----------
Faites un POST sur l'endpoint :
POST https://<votre-projet>.vercel.app/api/bridge
Headers:
  - Content-Type: application/json
  - x-bridge-secret: <BRIDGE_SECRET>

Body JSON exemple :
{
  "owner": "monCompte",
  "repo": "monRepo",
  "path": "README.md",
  "instruction": "Améliore le README en 3 étapes, plus clair et court.",
  "mode": "pr"    // ou "direct" pour committer directement sur la branche DEFAULT_BASE
}

Réponse (mode pr) :
{ "ok": true, "pr": "https://github.com/..." }

Sécurité et bonnes pratiques
----------------------------
- Toujours utiliser BRIDGE_SECRET et HTTPS (Vercel fournit TLS).
- Ne donnez que les permissions nécessaires au PAT.
- Préférez "mode": "pr" pour revue humaine.
- Limitez la taille et validez l'instruction côté serveur pour éviter abus.

Adaptation à l'API Mammouth
---------------------------
- MAMMOUTH_API_URL et la structure du body sont configurables ; si la doc Mammouth diffère (nom du champ de prompt, champ de sortie), modifiez utils/mammouth.js pour parser correctement la réponse.

Support
-------
Si vous me fournissez un exemple réel de la réponse JSON d'un appel Mammouth (sans la clé), je peux adapter utils/mammouth.js pour faire un parsing exact.
