import { requireEnvironment } from "../environment.js";
import { getWeatherSummary } from "../weather.js";
import type { BriefingModule } from "./types.js";

export function createWeatherModule(): BriefingModule {
    const postalCode = requireEnvironment("BRIEFING_WEATHER_POSTAL_CODE");
    const countryCode = requireEnvironment("BRIEFING_WEATHER_COUNTRY_CODE");

    return {
        id: "weather",
        label: "weather",
        fallbackHeading: "## Weather",
        promptInstructions: `
- windSpeed is measured in km/h.
- Temperatures are measured in °C.
- Distinguish current conditions from today's forecast.
- Use supplied values exactly.
- Precipitation probability is not rainfall amount.
- Do not invent hourly timing or guarantee precipitation.
- Keep this section short.`,
        collect: async () => {
            console.log(`Collecting weather for postal code: ${postalCode}, ${countryCode.toUpperCase()}`);
            const summary = await getWeatherSummary(postalCode, countryCode);

            return {
                heading: `## Weather in ${summary.location}`,
                data: summary,
            };
        },
    };
}
