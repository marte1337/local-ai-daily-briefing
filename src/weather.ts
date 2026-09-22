import type { WeatherSummary } from "./types.js";
import { weatherCodeToCondition } from "./weather-codes.js";

const REQUEST_TIMEOUT_MS = 10_000;

type WeatherLocation = {
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
    timezone: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecord(record: Record<string, unknown>, key: string, source: string): Record<string, unknown> {
    const value = record[key];

    if (!isRecord(value)) {
        throw new Error(`${source} is missing object field: ${key}`);
    }

    return value;
}

function readString(record: Record<string, unknown>, key: string, source: string): string {
    const value = record[key];

    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`${source} is missing string field: ${key}`);
    }

    return value;
}

function readNumber(record: Record<string, unknown>, key: string, source: string): number {
    const value = record[key];

    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`${source} is missing numeric field: ${key}`);
    }

    return value;
}

function readFirstNumber(record: Record<string, unknown>, key: string, source: string): number {
    const value = record[key];

    if (!Array.isArray(value) || typeof value[0] !== "number" || !Number.isFinite(value[0])) {
        throw new Error(`${source} is missing numeric array field: ${key}`);
    }

    return value[0];
}

function buildPostalCodeUrl(postalCode: string, countryCode: string): URL {
    return new URL(`${encodeURIComponent(countryCode)}/${encodeURIComponent(postalCode)}`, "https://api.zippopotam.us/");
}

function buildGeocodingUrl(placeName: string, countryCode: string): URL {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");

    url.searchParams.set("name", placeName);
    url.searchParams.set("countryCode", countryCode);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");

    return url;
}

function buildForecastUrl(location: WeatherLocation): URL {
    const url = new URL("https://api.open-meteo.com/v1/forecast");

    url.searchParams.set("latitude", String(location.latitude));
    url.searchParams.set("longitude", String(location.longitude));
    url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
    url.searchParams.set("daily", "temperature_2m_min,temperature_2m_max,precipitation_probability_max,weather_code");
    url.searchParams.set("temperature_unit", "celsius");
    url.searchParams.set("wind_speed_unit", "kmh");
    url.searchParams.set("timezone", location.timezone);
    url.searchParams.set("forecast_days", "1");

    return url;
}

async function fetchJson(url: URL, apiName: string, fetcher: typeof fetch): Promise<unknown> {
    let response: Response;

    try {
        response = await fetcher(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
        throw new Error(`Unable to reach the ${apiName} API`, { cause: error });
    }

    if (!response.ok) {
        const details = (await response.text()).trim();
        throw new Error(`${apiName} request failed with HTTP ${response.status} ${response.statusText}${details ? `: ${details}` : ""}`);
    }

    try {
        return await response.json();
    } catch (error) {
        throw new Error(`${apiName} API returned invalid JSON`, { cause: error });
    }
}

function readPlaceName(value: unknown, countryCode: string): string {
    if (!isRecord(value) || value["country abbreviation"] !== countryCode || !Array.isArray(value.places) || !isRecord(value.places[0])) {
        throw new Error(`Postal-code lookup returned no location in ${countryCode}.`);
    }

    return readString(value.places[0], "place name", "Postal-code lookup");
}

function readLocation(value: unknown): WeatherLocation {
    if (!isRecord(value) || !Array.isArray(value.results) || !isRecord(value.results[0])) {
        throw new Error("Open-Meteo geocoding returned no location.");
    }

    const result = value.results[0];

    return {
        name: readString(result, "name", "Open-Meteo geocoding response"),
        country: typeof result.country === "string" ? result.country : undefined,
        latitude: readNumber(result, "latitude", "Open-Meteo geocoding response"),
        longitude: readNumber(result, "longitude", "Open-Meteo geocoding response"),
        timezone: readString(result, "timezone", "Open-Meteo geocoding response"),
    };
}

export async function resolveWeatherLocation(postalCode: string, countryCode: string, fetcher: typeof fetch = fetch): Promise<WeatherLocation> {
    const normalizedPostalCode = postalCode.trim();
    const normalizedCountryCode = countryCode.trim().toUpperCase();

    if (normalizedPostalCode.length < 2) {
        throw new Error("BRIEFING_WEATHER_POSTAL_CODE must contain at least two characters.");
    }

    if (!/^[A-Z]{2}$/.test(normalizedCountryCode)) {
        throw new Error("BRIEFING_WEATHER_COUNTRY_CODE must be a two-letter ISO country code.");
    }

    const postalData = await fetchJson(buildPostalCodeUrl(normalizedPostalCode, normalizedCountryCode), "Zippopotam.us postal-code", fetcher);
    const placeName = readPlaceName(postalData, normalizedCountryCode);
    const locationData = await fetchJson(buildGeocodingUrl(placeName, normalizedCountryCode), "Open-Meteo geocoding", fetcher);

    return readLocation(locationData);
}

export async function getWeatherSummary(postalCode: string, countryCode: string, fetcher: typeof fetch = fetch): Promise<WeatherSummary> {
    const location = await resolveWeatherLocation(postalCode, countryCode, fetcher);
    const value = await fetchJson(buildForecastUrl(location), "Open-Meteo weather", fetcher);

    if (!isRecord(value)) {
        throw new Error("Open-Meteo weather response is invalid.");
    }

    const timezone = readString(value, "timezone", "Open-Meteo weather response");

    if (timezone !== location.timezone) {
        throw new Error(`Open-Meteo returned unexpected timezone: ${timezone}`);
    }

    const current = readRecord(value, "current", "Open-Meteo weather response");
    const daily = readRecord(value, "daily", "Open-Meteo weather response");

    return {
        location: location.country ? `${location.name}, ${location.country}` : location.name,
        currentTemperature: readNumber(current, "temperature_2m", "Open-Meteo current weather"),
        apparentTemperature: readNumber(current, "apparent_temperature", "Open-Meteo current weather"),
        currentCondition: weatherCodeToCondition(readNumber(current, "weather_code", "Open-Meteo current weather")),
        windSpeed: readNumber(current, "wind_speed_10m", "Open-Meteo current weather"),
        today: {
            minTemperature: readFirstNumber(daily, "temperature_2m_min", "Open-Meteo daily forecast"),
            maxTemperature: readFirstNumber(daily, "temperature_2m_max", "Open-Meteo daily forecast"),
            precipitationProbability: readFirstNumber(daily, "precipitation_probability_max", "Open-Meteo daily forecast"),
            condition: weatherCodeToCondition(readFirstNumber(daily, "weather_code", "Open-Meteo daily forecast")),
        },
    };
}
