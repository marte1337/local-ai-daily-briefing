import type { BriefingModuleName } from "../config.js";

export type BriefingModuleOutput = {
    heading: string;
    data: unknown;
};

export type BriefingModule = {
    id: BriefingModuleName;
    label: string;
    fallbackHeading: string;
    promptInstructions: string;
    collect: () => Promise<BriefingModuleOutput>;
};

export type CollectedBriefingModule = Omit<BriefingModule, "collect"> & {
    heading: string;
    data: unknown | null;
};
