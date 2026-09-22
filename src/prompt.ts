import type { CollectedBriefingModule } from "./modules/types.js";

export function buildDailyBriefingPrompt(modules: CollectedBriefingModule[]): string {
    const sectionList = modules.map((module) => module.heading).join("\n");
    const instructions = modules
        .map(
            (module) => `${module.heading}
${module.promptInstructions.trim()}`,
        )
        .join("\n\n");
    const data = modules
        .map(
            (module) => `${module.id.toUpperCase()} DATA:
${module.data === null ? "UNAVAILABLE" : JSON.stringify(module.data)}`,
        )
        .join("\n\n");

    return `
Create a concise English morning briefing using only the supplied data.

OUTPUT EXACTLY THESE SECTIONS IN THIS ORDER:

${sectionList}

Do not add an introduction, conclusion, key takeaway, recommendations, questions, or additional sections.

GENERAL:
- Use each section heading exactly as listed above.
- Use only facts supported by the supplied data.
- Do not invent causes, consequences, technical details, interpretations, or predictions.
- Keep the briefing concise but informative.
- If data for a configured section is UNAVAILABLE, say so briefly under that heading and continue.

SECTION-SPECIFIC INSTRUCTIONS:

${instructions}

SUPPLIED DATA:

${data}
`;
}
