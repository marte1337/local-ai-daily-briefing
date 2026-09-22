import assert from "node:assert/strict";
import test from "node:test";
import { getWeatherSummary } from "../src/weather.js";

test("resolves a postal code to a place before requesting its forecast", async () => {
    const requestedUrls: URL[] = [];
    const responses = [
        {
            country: "Germany",
            "country abbreviation": "DE",
            places: [{ "place name": "Bremen" }],
        },
        {
            results: [
                {
                    name: "Bremen",
                    country: "Germany",
                    latitude: 53.07516,
                    longitude: 8.80777,
                    timezone: "Europe/Berlin",
                },
            ],
        },
        {
            timezone: "Europe/Berlin",
            current: {
                temperature_2m: 18,
                apparent_temperature: 17,
                weather_code: 2,
                wind_speed_10m: 12,
            },
            daily: {
                temperature_2m_min: [11],
                temperature_2m_max: [20],
                precipitation_probability_max: [25],
                weather_code: [3],
            },
        },
    ];
    const fetcher = (async (input: URL | RequestInfo) => {
        requestedUrls.push(new URL(String(input)));
        return new Response(JSON.stringify(responses.shift()), { status: 200 });
    }) as typeof fetch;

    const summary = await getWeatherSummary("28195", "de", fetcher);

    assert.equal(summary.location, "Bremen, Germany");
    assert.equal(summary.currentCondition, "Partly cloudy");
    assert.equal(requestedUrls[0].href, "https://api.zippopotam.us/DE/28195");
    assert.equal(requestedUrls[1].searchParams.get("name"), "Bremen");
    assert.equal(requestedUrls[2].searchParams.get("latitude"), "53.07516");
    assert.equal(requestedUrls[2].searchParams.get("timezone"), "Europe/Berlin");
});

test("rejects an invalid country code before making a request", async () => {
    let called = false;
    const fetcher = (async () => {
        called = true;
        return new Response();
    }) as typeof fetch;

    await assert.rejects(() => getWeatherSummary("28195", "Germany", fetcher), /two-letter ISO country code/);
    assert.equal(called, false);
});
