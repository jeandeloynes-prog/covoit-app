// utils/github.js
const { Octokit } = require("@octokit/rest");

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN manquant");
  return new Octokit({ auth: token });
}

async function getDefaultBranch({ owner, repo }) {
  const octokit = getOctokit();
  const { data } = await octokit.repos.get({ owner, repo });
  return data.default_branch;
}

async function getRef({ owner, repo, ref }) {
  const octokit = getOctokit();
  const { data } = await octokit.git.getRef({ owner, repo, ref: `heads/${ref}` });
  return data; // { object: { sha } }
}

async function createRef({ owner, repo, ref, sha }) {
  const octokit = getOctokit();
  const { data } = await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${ref}`,
    sha
  });
  return data;
}

async function ensureBranchFromBase({ owner, repo, base, branch }) {
  const octokit = getOctokit();
  // Récupérer SHA de base
  const baseRef = await getRef({ owner, repo, ref: base }).catch(async () => {
    const def = await getDefaultBranch({ owner, repo });
    if (base && base !== def) throw new Error(`Branche base introuvable: ${base}`);
    const defRef = await getRef({ owner, repo, ref: def });
    return defRef;
  });

  const baseSha = baseRef.object.sha;

  // Tenter de récupérer la branche cible
  const exists = await getRef({ owner, repo, ref: branch }).catch(() => null);
  if (exists) return exists;

  // Créer la nouvelle branche
  return createRef({ owner, repo, ref: branch, sha: baseSha });
}

async function getFileSha({ owner, repo, path, ref }) {
  const octokit = getOctokit();
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path, ref });
    if (Array.isArray(data)) throw new Error("Le chemin pointe sur un répertoire");
    return data.sha; // sha du fichier existant
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

function toBase64(str) {
  return Buffer.from(str, "utf8").toString("base64");
}

async function createOrUpdateFile({ owner, repo, branch, path, content, message }) {
  const octokit = getOctokit();
  const sha = await getFileSha({ owner, repo, path, ref: branch });
  const params = {
    owner,
    repo,
    path,
    message,
    content: toBase64(content),
    branch
  };
  if (sha) params.sha = sha;
  const { data } = await octokit.repos.createOrUpdateFileContents(params);
  return data;
}

async function createPullRequest({ owner, repo, head, base, title, body }) {
  const octokit = getOctokit();
  const { data } = await octokit.pulls.create({ owner, repo, head, base, title, body });
  return data;
}

module.exports = {
  ensureBranchFromBase,
  createOrUpdateFile,
  createPullRequest
};
