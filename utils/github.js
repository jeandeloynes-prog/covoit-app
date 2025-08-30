// utils/github.js
const { Octokit } = require("@octokit/rest");

if (!process.env.GITHUB_TOKEN) {
  // Ne throw pas immédiatement ; laisser l'erreur se produire à l'appel si manquant
  console.warn("GITHUB_TOKEN not set in environment variables");
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function getFile(owner, repo, path, ref) {
  try {
    const r = await octokit.repos.getContent({ owner, repo, path, ref });
    return r; // contient data.sha etc.
  } catch (e) {
    // 404 probable si file absent
    if (e.status === 404) return null;
    throw e;
  }
}

async function createBranchFrom(owner, repo, newBranch, baseBranch = "main") {
  // get base ref SHA
  const baseRef = await octokit.git.getRef({ owner, repo, ref: `heads/${baseBranch}` });
  const sha = baseRef.data.object.sha;
  await octokit.git.createRef({ owner, repo, ref: `refs/heads/${newBranch}`, sha });
}

async function createOrUpdateFile(owner, repo, path, content, branch = "main", message = "update via mammouth") {
  // content: string (plain text) -> base64
  const encoded = Buffer.from(content, "utf8").toString("base64");

  // check file existence on the target branch
  try {
    const existing = await getFile(owner, repo, path, branch);
    if (!existing) {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: encoded,
        branch
      });
    } else {
      const sha = existing.data.sha;
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: encoded,
        branch,
        sha
      });
    }
  } catch (e) {
    // Bubble up a useful message
    throw new Error(`GitHub createOrUpdateFile error: ${e.message || e}`);
  }
}

async function createPullRequest(owner, repo, path, content, branchName, baseBranch = "main", message = "mammouth update") {
  // 1) create branch from base
  await createBranchFrom(owner, repo, branchName, baseBranch);

  // 2) add/update file on new branch
  await createOrUpdateFile(owner, repo, path, content, branchName, message);

  // 3) open PR
  const pr = await octokit.pulls.create({
    owner,
    repo,
    title: message,
    head: branchName,
    base: baseBranch,
    body: "Proposition de modification via mammouth"
  });

  return pr.data.html_url;
}

module.exports = {
  getFile,
  createBranchFrom,
  createOrUpdateFile,
  createPullRequest
};
