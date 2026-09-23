import { getGeneralNews } from "../news/general-news.js";
import { translateNewsTitles } from "../news/translate-news.js";
import type { NewsItem } from "../types.js";
import type { BriefingModule } from "./types.js";

export function createGeneralNewsModule(model: string): BriefingModule {
    return {
        id: "general-news",
        label: "general news",
        fallbackHeading: "## General News",
        promptInstructions: `
- Select 4-5 of the most important candidates.
- Prioritize significant German, European, international, economic and geopolitical stories.
- Deprioritize sports, entertainment, local crime and human-interest stories unless broadly significant.
- Use englishTitle EXACTLY as the Markdown link label.
- Translate and summarize the supplied German summary into one concise English sentence.
- Preserve the supplied URL exactly.
- Every item must be a separate Markdown bullet, with one blank line between items.
- Format each item as: - [englishTitle](URL) — concise English summary`,
        collect: async () => {
            const items = await getGeneralNews();
            let translatedItems = items;

            // Keep translation as a focused model call: broader briefing prompts
            // have repeatedly left German headlines untranslated.
            try {
                translatedItems = await translateNewsTitles(items, model);
            } catch (error) {
                console.error("Failed to translate general-news titles; using original titles:", error);
            }

            return {
                heading: "## General News",
                data: prepareGeneralNewsData(translatedItems),
            };
        },
    };
}

function prepareGeneralNewsData(items: NewsItem[]) {
    return items.map((item) => ({
        englishTitle: item.englishTitle ?? item.title,
        url: item.url,
        summary: item.summary,
    }));
}
