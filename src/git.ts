import { execFile } from "node:child_process";
import { basename } from "node:path";
import { promisify } from "node:util";
import type { ActiveBranch, ActiveBranchCommit, GitCommit, GitSummary } from "./types.js";

const execFileAsync = promisify(execFile);
const COMMIT_MARKER = "@@COMMIT@@";
const FIELD_SEPARATOR = "\x1f";

async function git(repoPath: string, args: string[]): Promise<string> {
    const { stdout } = await execFileAsync("git", args, {
        cwd: repoPath,
        encoding: "utf8",
    });

    return stdout.trim();
}

function parseCommits(output: string): GitCommit[] {
    if (!output) {
        return [];
    }

    const commits: GitCommit[] = [];
    let currentCommit: GitCommit | undefined;

    for (const line of output.split(/\r?\n/)) {
        if (line.startsWith(COMMIT_MARKER)) {
            const [hash, author, date, message] = line.slice(COMMIT_MARKER.length).split(FIELD_SEPARATOR);

            currentCommit = {
                hash,
                author,
                date,
                message,
                changedFiles: [],
            };
            commits.push(currentCommit);
        } else if (currentCommit && line.trim()) {
            currentCommit.changedFiles.push(line.trim());
        }
    }

    return commits;
}

async function getRecentCommits(repoPath: string, since: string): Promise<GitCommit[]> {
    const output = await git(repoPath, [
        "log",
        `--since=${since}`,
        "--no-merges",
        "--find-renames",
        `--format=${COMMIT_MARKER}%h${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%aI${FIELD_SEPARATOR}%s`,
        "--name-only",
    ]);

    return parseCommits(output);
}

function parseBranchCommits(output: string): ActiveBranchCommit[] {
    if (!output) {
        return [];
    }

    return output.split(/\r?\n/).map((line) => {
        const [hash, author, date, message] = line.split(FIELD_SEPARATOR);
        return { hash, author, date, message };
    });
}

async function getUnmergedBranchCommits(repoPath: string, branchName: string, since: string, limit = 5): Promise<ActiveBranchCommit[]> {
    const output = await git(repoPath, [
        "log",
        "--no-merges",
        `--since=${since}`,
        `-${limit}`,
        `--format=%h${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%aI${FIELD_SEPARATOR}%s`,
        `origin/main..${branchName}`,
    ]);

    return parseBranchCommits(output);
}

async function refreshRemoteBranches(repoPath: string): Promise<void> {
    try {
        await git(repoPath, ["fetch", "--prune", "origin"]);
    } catch {
        console.warn("Could not refresh remote Git branches. Using cached remote data.");
    }
}

async function getActiveBranch(repoPath: string, branchName: string, since: string): Promise<ActiveBranch | null> {
    const unmergedCommits = await getUnmergedBranchCommits(repoPath, branchName, since);
    const latestCommit = unmergedCommits[0];

    if (!latestCommit) {
        return null;
    }

    const commitsAhead = Number.parseInt(await git(repoPath, ["rev-list", "--count", `origin/main..${branchName}`]), 10);

    return {
        name: branchName.replace(/^origin\//, ""),
        author: latestCommit.author,
        lastCommitDate: latestCommit.date,
        commitsAhead,
        unmergedCommits,
    };
}

async function getActiveBranches(repoPath: string, since: string): Promise<ActiveBranch[]> {
    const output = await git(repoPath, ["for-each-ref", "refs/remotes/origin", "--no-merged=origin/main", "--format=%(refname:short)"]);
    const branchNames = output
        .split(/\r?\n/)
        .map((branch) => branch.trim())
        .filter((branch) => branch && branch !== "origin/main" && branch !== "origin/HEAD");

    const branches = await Promise.all(branchNames.map((branchName) => getActiveBranch(repoPath, branchName, since)));

    return branches
        .filter((branch): branch is ActiveBranch => branch !== null)
        .sort((a, b) => Date.parse(b.lastCommitDate) - Date.parse(a.lastCommitDate));
}

async function getActiveBranchesSafely(repoPath: string, since: string): Promise<ActiveBranch[]> {
    try {
        return await getActiveBranches(repoPath, since);
    } catch {
        console.warn("Could not inspect active remote branches.");
        return [];
    }
}

export async function getGitSummary(repoPath: string, since = "1 day ago", branchSince = "1 day ago"): Promise<GitSummary> {
    await refreshRemoteBranches(repoPath);

    const [branch, status, commits, activeBranches, unstagedDiff, stagedDiff] = await Promise.all([
        git(repoPath, ["rev-parse", "--abbrev-ref", "HEAD"]),
        git(repoPath, ["status", "--short"]),
        getRecentCommits(repoPath, since),
        getActiveBranchesSafely(repoPath, branchSince),
        git(repoPath, ["diff", "--stat"]),
        git(repoPath, ["diff", "--cached", "--stat"]),
    ]);

    return {
        repository: basename(repoPath),
        branch,
        workingTree: status || "Clean",
        commits,
        activeBranches,
        unstagedDiff: unstagedDiff || "None",
        stagedDiff: stagedDiff || "None",
    };
}
