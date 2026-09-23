# Local AI Daily Briefing

Local AI Daily Briefing collects information from several sources, summarizes it with a locally running language model, and sends the resulting report by email. It is intended for recurring personal briefings that combine project activity, weather, and news in a single document.

The briefing is assembled from independent modules. Modules can be enabled, disabled, and reordered in `briefing.config.json`, so a report can contain only Git activity and weather, for example, or include all available news sections. Module-specific settings such as the repository path, postal code, and Git activity windows are kept in the Git-ignored `.env` file.

Text generation runs through Ollama. Any suitable text-generation model installed in Ollama can be selected with `BRIEFING_MODEL`, without changes to the application code. Collection and preprocessing are handled deterministically where possible; the model is used to select, organize, translate, and summarize the supplied data. Briefing data is not sent to a hosted AI API by this application, although individual modules still contact their configured external data sources.

Module collection runs concurrently. If one data source is unavailable, the other configured sections can still be generated. The shared module interface also provides a defined place for adding new sources, their prompt instructions, and their output headings. The final Markdown report is rendered as HTML and sent through Microsoft Graph.

## Available modules

- `git` — recent main-branch activity and active unmerged remote branches
- `weather` — current conditions and today's forecast for a configured postal code
- `general-news` — important general news
- `ai-news` — AI and developer-tooling news

## Choose and order modules

`briefing.config.json` lists every available module with a short description. Set `enabled` to `true` or `false`; the array order controls the order of enabled sections:

```json
{
    "modules": [
        {
            "name": "git",
            "description": "Recent main-branch activity and active unmerged remote branches.",
            "enabled": true
        },
        {
            "name": "weather",
            "description": "Current conditions and today's forecast for the postal code configured in .env.",
            "enabled": true
        },
        {
            "name": "general-news",
            "description": "Important general news from the configured feed.",
            "enabled": false
        },
        {
            "name": "ai-news",
            "description": "AI and developer-tooling news.",
            "enabled": false
        }
    ]
}
```

At least one module must be enabled, and a module cannot be listed more than once. To keep the config elsewhere, set `BRIEFING_CONFIG` to its path.

## Configure values

Copy `.env.example` to `.env` and set the values needed by the enabled modules. `.env` is ignored by Git; `briefing.config.json` contains no user-specific values.

Always required:

```dotenv
BRIEFING_MODEL=qwen3.5:9b
```

Required only by `git`:

```dotenv
BRIEFING_REPO=D:/path/to/your/repository
BRIEFING_GIT_MAIN_DAYS=1
BRIEFING_GIT_BRANCH_DAYS=7
```

The Git windows are optional and default to one day. If the branch window is omitted, it uses the main-branch window.

Required only by `weather`:

```dotenv
BRIEFING_WEATHER_POSTAL_CODE=28195
BRIEFING_WEATHER_COUNTRY_CODE=DE
```

The country code must be a two-letter ISO country code. The weather module uses Zippopotam.us to find the place name for the postal code, then resolves that place through Open-Meteo. The resulting coordinates and local timezone are used for the forecast request.

Email delivery requires:

```dotenv
MS_CLIENT_ID=
MS_TENANT_ID=
BRIEFING_RECIPIENTS=person@example.com
```

Multiple recipients can be separated with commas.

## Run

Install dependencies, make sure Ollama is running with the configured model, and execute:

```sh
npm run briefing
```

The application collects enabled modules concurrently. If one collector fails, its section is marked unavailable while the remaining sections are still generated.

## Development checks

```sh
npm test
npm run typecheck
```
