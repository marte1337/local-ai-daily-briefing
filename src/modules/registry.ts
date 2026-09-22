import type { BriefingModuleName } from "../config.js";
import { createAiNewsModule } from "./ai-news-module.js";
import { createGeneralNewsModule } from "./general-news-module.js";
import { createGitModule } from "./git-module.js";
import type { BriefingModule } from "./types.js";
import { createWeatherModule } from "./weather-module.js";

export function createBriefingModule(name: BriefingModuleName, model: string): BriefingModule {
    switch (name) {
        case "git":
            return createGitModule();
        case "weather":
            return createWeatherModule();
        case "general-news":
            return createGeneralNewsModule(model);
        case "ai-news":
            return createAiNewsModule();
    }
}
