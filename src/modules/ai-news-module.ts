import { getAiNews } from "../news/tldr-ai.js";
import type { BriefingModule } from "./types.js";

export function createAiNewsModule(): BriefingModule {
    return {
        id: "ai-news",
        label: "AI news",
        fallbackHeading: "## AI News",
        promptInstructions: `
- Select 4-5 of the most useful candidates.
- Prioritize models, developer tooling, APIs, local/open-weight AI, inference and meaningful research.
- Summarize each item in one concise sentence without strengthening or embellishing the supplied claim.
- Preserve the supplied title and URL exactly.
- If readingMinutes is supplied, include "(X min read)" after the link; otherwise omit it.
- Every item must be a separate Markdown bullet, with one blank line between items.
- Format items with reading time as: - [Article title](URL) (X min read) — concise summary
- Format items without reading time as: - [Article title](URL) — concise summary`,
        collect: async () => {
            const items = await getAiNews();

            return {
                heading: "## AI News",
                data: items.map((item) => ({
                    title: item.title,
                    url: item.url,
                    summary: item.summary,
                    section: item.section,
                    readingMinutes: item.readingMinutes,
                })),
            };
        },
    };
}
