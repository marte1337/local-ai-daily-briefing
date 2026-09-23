import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const BRIEFING_MODULE_NAMES = ["git", "weather", "general-news", "ai-news"] as const;

export type BriefingModuleName = (typeof BRIEFING_MODULE_NAMES)[number];

export type BriefingConfig = {
    modules: BriefingModuleName[];
};

const MODULE_NAMES = new Set<string>(BRIEFING_MODULE_NAMES);

export async function loadBriefingConfig(configPath = process.env.BRIEFING_CONFIG ?? "briefing.config.json"): Promise<BriefingConfig> {
    const resolvedPath = resolve(configPath);
    let contents: string;

    try {
        contents = await readFile(resolvedPath, "utf8");
    } catch (error) {
        throw new Error(`Unable to read briefing config at ${resolvedPath}`, { cause: error });
    }

    let value: unknown;

    try {
        value = JSON.parse(contents);
    } catch (error) {
        throw new Error(`Briefing config at ${resolvedPath} is not valid JSON`, { cause: error });
    }

    return parseBriefingConfig(value);
}

export function parseBriefingConfig(value: unknown): BriefingConfig {
    if (!isRecord(value) || !Array.isArray(value.modules)) {
        throw new Error('Briefing config must contain a "modules" array.');
    }

    const modules: BriefingModuleName[] = [];
    const seen = new Set<string>();

    for (const moduleConfig of value.modules) {
        const moduleName = readModuleName(moduleConfig);
        const enabled = readModuleEnabled(moduleConfig);

        if (!MODULE_NAMES.has(moduleName)) {
            throw new Error(`Unknown briefing module: ${String(moduleName)}. Available modules: ${BRIEFING_MODULE_NAMES.join(", ")}.`);
        }

        if (seen.has(moduleName)) {
            throw new Error(`Briefing module is listed more than once: ${moduleName}.`);
        }

        seen.add(moduleName);

        if (enabled) {
            modules.push(moduleName as BriefingModuleName);
        }
    }

    if (modules.length === 0) {
        throw new Error("Briefing config must enable at least one module.");
    }

    return { modules };
}

function readModuleName(value: unknown): string {
    if (!isRecord(value) || typeof value.name !== "string") {
        throw new Error('Each briefing module must be an object containing a string "name".');
    }

    return value.name;
}

function readModuleEnabled(value: unknown): boolean {
    if (!isRecord(value) || typeof value.enabled !== "boolean") {
        throw new Error('Each briefing module object must contain a boolean "enabled" value.');
    }

    return value.enabled;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
