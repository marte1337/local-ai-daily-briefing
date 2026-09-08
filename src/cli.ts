export type BriefingCliOptions = {
    repoPath: string;
    model: string;
    mainGitDays: number;
    branchGitDays: number;
};

const DEFAULT_GIT_DAYS = 1;
const DEFAULT_MODEL = process.env.npm_package_config_defaultModel;

if (!DEFAULT_MODEL) {
    throw new Error("Missing config.defaultModel in package.json.");
}

function parseDays(value: string | undefined): number | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (!/^\d+$/.test(value)) {
        throw new Error(`Invalid Git window "${value}". Expected a number of days.`);
    }

    const days = Number.parseInt(value, 10);

    if (days < 1) {
        throw new Error("Git window must be at least 1 day.");
    }

    return days;
}

export function parseCliArgs(args = process.argv.slice(2)): BriefingCliOptions {
    const repoPath = args[0];

    if (!repoPath) {
        throw new Error("Usage: npm run briefing -- <repository-path> [model] [main-days] [branch-days]");
    }

    let index = 1;
    let model = DEFAULT_MODEL;

    // A non-numeric second argument is interpreted as the model.
    if (args[index] && !/^\d+$/.test(args[index])) {
        model = args[index];
        index++;
    }

    const mainGitDays = parseDays(args[index]) ?? DEFAULT_GIT_DAYS;

    index++;

    const branchGitDays = parseDays(args[index]) ?? mainGitDays;

    return {
        repoPath,
        model,
        mainGitDays,
        branchGitDays,
    };
}

export function daysAgo(days: number): string {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
}
