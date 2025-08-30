import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function getFile(owner, repo, path, ref) {
  try {
    const r = await octokit.repos.getContent({ owner, repo, path, ref });
    return r;
  } catch (e) {
    // 404 ou autre -> retourner null
    return null;
  }
}

export async function createBranchFrom(owner, repo, newBranch, baseBranch = "main") {
  const baseRef = await octokit.git.getRef({ owner, repo, ref: `heads/${baseBranch}` });
  const sha = baseRef.data.object.sha;
  await octokit.git.createRef({ owner, repo, ref: `refs/heads/${newBranch}`, sha });
}

export async function createOrUpdateFile(owner, repo, path, content, branch = "main", message = "update via mammouth") {
  const existing = await getFile(owner, repo, path, branch);
  const encoded = Buffer.from(content, "utf8").toString("base64");
  if (!existing) {
    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path, message, content: encoded, branch
    });
  } else {
    const sha = existing.data.sha;
    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path, message, content: encoded, branch, sha
    });
  }
}

export async function createPullRequest(owner, repo, path, content, branchName, baseBranch = "main", message = "mammouth update") {
  // 1) create branch
  await createBranchFrom(owner, repo, branchName, baseBranch);
  // 2) create/update file on new branch
  await createOrUpdateFile(owner, repo, path, content, branchName, message);
  // 3) create PR
  const pr = await octokit.pulls.create({
    owner, repo, title: message, head: branchName, base: baseBranch, body: "Proposition de modification via mammouth"
  });
  return pr.data.html_url;
}
