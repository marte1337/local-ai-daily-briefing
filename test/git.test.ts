import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { getGitSummary } from "../src/git.js";

const execFileAsync = promisify(execFile);

test("collects recent commit metadata and changed filenames", async (context) => {
    const testRoot = await mkdtemp(join(tmpdir(), "local-daily-briefing-git-"));
    const repoPath = join(testRoot, "repo");
    const remotePath = join(testRoot, "remote.git");
    context.after(() => rm(testRoot, { recursive: true, force: true }));

    await mkdir(repoPath);
    await execFileAsync("git", ["init", "--bare", remotePath]);

    const runGit = (...args: string[]) => execFileAsync("git", args, { cwd: repoPath, encoding: "utf8" });

    await runGit("init", "-b", "main");
    await runGit("config", "user.name", "Test User");
    await runGit("config", "user.email", "test@example.com");
    await writeFile(join(repoPath, "example.txt"), "briefing\n", "utf8");
    await runGit("add", "example.txt");
    await runGit("commit", "-m", "Add briefing example");
    await runGit("remote", "add", "origin", remotePath);
    await runGit("push", "-u", "origin", "main");

    const summary = await getGitSummary(repoPath, "7 days ago", "7 days ago");

    assert.equal(summary.branch, "main");
    assert.equal(summary.workingTree, "Clean");
    assert.equal(summary.commits.length, 1);
    assert.equal(summary.commits[0].message, "Add briefing example");
    assert.deepEqual(summary.commits[0].changedFiles, ["example.txt"]);
});
