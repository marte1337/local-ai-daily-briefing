export type GitCommit = {
    hash: string;
    author: string;
    date: string;
    message: string;
    changedFiles: string[];
};

export type ActiveBranchCommit = {
    hash: string;
    author: string;
    date: string;
    message: string;
};

export type ActiveBranch = {
    name: string;
    author: string;
    lastCommitDate: string;
    commitsAhead: number;
    unmergedCommits: ActiveBranchCommit[];
};

export type GitSummary = {
    repository: string;
    branch: string;
    workingTree: string;
    commits: GitCommit[];
    activeBranches: ActiveBranch[];
    unstagedDiff: string;
    stagedDiff: string;
};

export type WeatherSummary = {
    location: string;
    currentTemperature: number;
    apparentTemperature: number;
    currentCondition: string;
    windSpeed: number;
    today: {
        minTemperature: number;
        maxTemperature: number;
        precipitationProbability: number;
        condition: string;
    };
};

export type NewsItem = {
    title: string;
    englishTitle?: string;
    url: string;
    publishedAt?: string | null;
    summary: string | null;
    section?: string;
    readingMinutes?: number;
};
