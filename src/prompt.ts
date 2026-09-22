import type { GitSummary, NewsSummary, WeatherSummary } from "./types.js";

type PromptOptions = {
    mainGitDays: number;
    branchGitDays: number;
};

export function buildDailyBriefingPrompt(
    gitSummary: GitSummary | null,
    weatherSummary: WeatherSummary | null,
    newsSummary: NewsSummary | null,
    options: PromptOptions,
): string {
    const gitData = gitSummary
        ? {
              repository: gitSummary.repository,
              branch: gitSummary.branch,
              workingTree: gitSummary.workingTree,

              mainActivityWindowDays: options.mainGitDays,

              branchActivityWindowDays: options.branchGitDays,

              latestMainCommitDate: gitSummary.commits.length > 0 ? formatDate(gitSummary.commits[0].date) : undefined,

              commits: gitSummary.commits.map((commit) => ({
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

              activeBranches: gitSummary.activeBranches.map((branch) => ({
                  name: branch.name,
                  commitsAhead: branch.commitsAhead,
                  lastCommitDate: branch.lastCommitDate ? formatDate(branch.lastCommitDate) : undefined,
                  author: branch.author,
                  unmergedCommits: branch.unmergedCommits.map((commit) => ({
                      ...commit,
                      date: formatDate(commit.date),
                  })),
              })),

              unstagedDiff: gitSummary.unstagedDiff,
              stagedDiff: gitSummary.stagedDiff,
          }
        : null;

    const generalNewsData = newsSummary
        ? newsSummary.general.map((item) => ({
              englishTitle: item.englishTitle ?? item.title,
              url: item.url,
              summary: item.summary,
          }))
        : null;

    const aiNewsData = newsSummary
        ? newsSummary.ai.map((item) => ({
              title: item.title,
              url: item.url,
              summary: item.summary,
              section: item.section,
              readingMinutes: item.readingMinutes,
          }))
        : null;

    console.log("\n=== JSON Data ===\n");
    console.log(gitData, weatherSummary, generalNewsData, aiNewsData);

    return `
Create a concise English morning briefing using only the supplied data.

OUTPUT EXACTLY THESE SECTIONS:

## Next.js Project
### Main branch
### Active unmerged branches

## Weather in Bremen

## General News

## AI News

Do not add an introduction, conclusion, key takeaway, recommendations, questions, or additional sections.

GENERAL:
- Use only facts supported by the supplied data.
- Do not invent causes, consequences, technical details, interpretations, or predictions.
- Keep the briefing concise but informative.
- If data for a section is UNAVAILABLE, say so briefly and continue.

PROJECT:
- Keep main-branch work and unmerged remote-branch work clearly separate.
- State the configured activity window for both Main branch and Active unmerged branches.
- Express activity windows naturally, for example "Activity window: last 7 days."
- For Main branch, state repository, branch and working-tree state.
- If commits are supplied, state latestMainCommitDate and summarize recent work by topic.
- If no commits are supplied, say that no main-branch commits were found within the configured activity window.
- Do not show a latest commit date when latestMainCommitDate is not supplied.
- Group related commits when useful, but keep unrelated work distinct.
- Mention components or files when they help explain the work.
- Treat supplied commit data as the source of truth.
- Do not infer behavior or architecture from filenames alone.
- Never calculate combined commit counts, file counts, additions, or deletions across multiple commits.
- Supplied Git statistics are authoritative.
- For each active branch, mention its name, commits ahead of main, and summarize its supplied unmerged commits.
- Mention lastCommitDate only when it is supplied.
- Do not describe unmerged branch work as already present on main.
- Do not infer whether a branch is finished, approved, abandoned, or ready to merge.
- If no active branches are supplied, say that no active unmerged branches were found within the configured branch activity window.

WEATHER:
- windSpeed is measured in km/h.
- Temperatures are measured in °C.
- Distinguish current conditions from today's forecast.
- Use supplied values exactly.
- Precipitation probability is not rainfall amount.
- Do not invent hourly timing or guarantee precipitation.
- Keep this section short.

GENERAL NEWS:
- Select 4-5 of the most important candidates.
- Prioritize significant German, European, international, economic and geopolitical stories.
- Deprioritize sports, entertainment, local crime and human-interest stories unless broadly significant.
- Use englishTitle EXACTLY as the Markdown link label.
- Translate and summarize the supplied German summary into one concise English sentence.
- Preserve the supplied URL exactly.
- Every item MUST be a separate Markdown bullet beginning with "- ".
- Put one blank line between news items.
- Never combine multiple articles into one paragraph.
- Format each item exactly as:
  - [englishTitle](URL) — concise English summary

AI NEWS:
- Select 4-5 of the most useful candidates.
- Prioritize models, developer tooling, APIs, local/open-weight AI, inference and meaningful research.
- Summarize each item in one concise sentence without strengthening or embellishing the supplied claim.
- Preserve the supplied title and URL exactly.
- If readingMinutes is supplied, include "(X min read)" after the link.
- If readingMinutes is not supplied, omit the reading-time text entirely.
- Every item MUST be a separate Markdown bullet beginning with "- ".
- Put one blank line between news items.
- Never combine multiple articles into one paragraph.
- Format items with reading time as:
  - [Article title](URL) (X min read) — concise summary
- Format items without reading time as:
  - [Article title](URL) — concise summary

GIT DATA:
${gitData ? JSON.stringify(gitData) : "UNAVAILABLE"}

WEATHER DATA:
${weatherSummary ? JSON.stringify(weatherSummary) : "UNAVAILABLE"}

GENERAL NEWS CANDIDATES:
${generalNewsData ? JSON.stringify(generalNewsData) : "UNAVAILABLE"}

AI NEWS CANDIDATES:
${aiNewsData ? JSON.stringify(aiNewsData) : "UNAVAILABLE"}
`;
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
