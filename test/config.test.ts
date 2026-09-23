import assert from "node:assert/strict";
import test from "node:test";
import { parseBriefingConfig } from "../src/config.js";

test("parses module selection and preserves order", () => {
    assert.deepEqual(
        parseBriefingConfig({
            modules: [
                { name: "weather", description: "Weather", enabled: true },
                { name: "general-news", description: "News", enabled: false },
                { name: "git", description: "Git", enabled: true },
            ],
        }),
        {
            modules: ["weather", "git"],
        },
    );
});

test("rejects the obsolete compact string format", () => {
    assert.throws(() => parseBriefingConfig({ modules: ["weather", "git"] }), /object containing a string "name"/);
});

test("rejects unknown modules", () => {
    assert.throws(() => parseBriefingConfig({ modules: [{ name: "calendar", enabled: true }] }), /Unknown briefing module: calendar/);
});

test("rejects duplicate and empty module lists", () => {
    assert.throws(() => parseBriefingConfig({ modules: [] }), /at least one module/);
    assert.throws(
        () =>
            parseBriefingConfig({
                modules: [
                    { name: "git", enabled: true },
                    { name: "git", enabled: false },
                ],
            }),
        /listed more than once/,
    );
    assert.throws(
        () =>
            parseBriefingConfig({
                modules: [
                    { name: "git", enabled: false },
                    { name: "weather", enabled: false },
                ],
            }),
        /at least one module/,
    );
});
