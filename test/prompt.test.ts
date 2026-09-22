import assert from "node:assert/strict";
import test from "node:test";
import type { CollectedBriefingModule } from "../src/modules/types.js";
import { buildDailyBriefingPrompt } from "../src/prompt.js";

test("includes only configured sections in their configured order", () => {
    const modules: CollectedBriefingModule[] = [
        {
            id: "weather",
            label: "weather",
            fallbackHeading: "## Weather",
            heading: "## Weather in Bremen, Germany",
            promptInstructions: "Keep it short.",
            data: { location: "Bremen, Germany" },
        },
        {
            id: "git",
            label: "Git activity",
            fallbackHeading: "## Git Activity",
            heading: "## Git Activity — example",
            promptInstructions: "Separate branches.",
            data: { repository: "example" },
        },
    ];

    const prompt = buildDailyBriefingPrompt(modules);
    const weatherPosition = prompt.indexOf("## Weather in Bremen, Germany");
    const gitPosition = prompt.indexOf("## Git Activity — example");

    assert.ok(weatherPosition >= 0);
    assert.ok(gitPosition > weatherPosition);
    assert.doesNotMatch(prompt, /## General News/);
    assert.doesNotMatch(prompt, /## AI News/);
});

test("marks failed configured modules as unavailable", () => {
    const prompt = buildDailyBriefingPrompt([
        {
            id: "weather",
            label: "weather",
            fallbackHeading: "## Weather",
            heading: "## Weather",
            promptInstructions: "Keep it short.",
            data: null,
        },
    ]);

    assert.match(prompt, /WEATHER DATA:\nUNAVAILABLE/);
});
