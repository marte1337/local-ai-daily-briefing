import { readPositiveIntegerEnvironment, requireEnvironment } from "../environment.js";
import { getGitSummary } from "../git.js";
import type { GitSummary } from "../types.js";
import type { BriefingModule } from "./types.js";

export function createGitModule(): BriefingModule {
    const repoPath = requireEnvironment("BRIEFING_REPO");
    const mainGitDays = readPositiveIntegerEnvironment("BRIEFING_GIT_MAIN_DAYS", 1);
    const branchGitDays = readPositiveIntegerEnvironment("BRIEFING_GIT_BRANCH_DAYS", mainGitDays);

    return {
        id: "git",
        label: "Git activity",
        fallbackHeading: "## Git Activity",
        promptInstructions: `
- Use the subheadings "### Main branch" and "### Active unmerged branches".
- Keep main-branch work and unmerged remote-branch work clearly separate.
- State the configured activity window for both subsections.
- Express activity windows naturally, for example "Activity window: last 7 days."
- For Main branch, state repository, branch and working-tree state.
- If commits are supplied, state latestMainCommitDate and summarize recent work by topic.
- If no commits are supplied, say that no main-branch commits were found within the configured activity window.
- Do not show a latest commit date when latestMainCommitDate is not supplied.
- Group related commits when useful, but keep unrelated work distinct.
- Mention components or files when they help explain the work.
- Treat supplied Git statistics as authoritative.
- Do not infer behavior or architecture from filenames alone.
- Never calculate combined commit counts, file counts, additions, or deletions across multiple commits.
- For each active branch, mention its name, commits ahead of main, and summarize its supplied unmerged commits.
- Mention lastCommitDate only when it is supplied.
- Do not describe unmerged branch work as already present on main.
- Do not infer whether a branch is finished, approved, abandoned, or ready to merge.
- If no active branches are supplied, say that none were found within the configured branch activity window.`,
        collect: async () => {
            console.log(`Collecting Git activity from: ${repoPath}`);
            console.log(`Git windows: main ${mainGitDays} day(s), branches ${branchGitDays} day(s)`);

            const summary = await getGitSummary(repoPath, daysAgo(mainGitDays), daysAgo(branchGitDays));

            return {
                heading: `## Git Activity — ${summary.repository}`,
                data: prepareGitData(summary, mainGitDays, branchGitDays),
            };
        },
    };
}

function prepareGitData(summary: GitSummary, mainGitDays: number, branchGitDays: number) {
    return {
        repository: summary.repository,
        branch: summary.branch,
        workingTree: summary.workingTree,
        mainActivityWindowDays: mainGitDays,
        branchActivityWindowDays: branchGitDays,
        latestMainCommitDate: summary.commits.length > 0 ? formatDate(summary.commits[0].date) : undefined,
        commits: summary.commits.map((commit) => ({
            hash: commit.hash,
            author: commit.author,
            date: formatDate(commit.date),
            message: commit.message,
            body: commit.body || undefined,
            addedFiles: commit.addedFiles,
            modifiedFiles: commit.modifiedFiles,
            deletedFiles: commit.deletedFiles,
            renamedFiles: commit.renamedFiles,
            filesChanged: commit.filesChanged,
            additions: commit.additions,
            deletions: commit.deletions,
        })),
        activeBranches: summary.activeBranches.map((branch) => ({
            name: branch.name,
            commitsAhead: branch.commitsAhead,
            lastCommitDate: formatDate(branch.lastCommitDate),
            author: branch.author,
            unmergedCommits: branch.unmergedCommits.map((commit) => ({
                ...commit,
                date: formatDate(commit.date),
            })),
        })),
        unstagedDiff: summary.unstagedDiff,
        stagedDiff: summary.stagedDiff,
    };
}

function daysAgo(days: number): string {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function formatDate(date: string | null | undefined): string | undefined {
    if (!date) {
        return undefined;
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Berlin",
    }).format(new Date(date));
}
