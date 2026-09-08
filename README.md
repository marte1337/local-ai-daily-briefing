# Local Daily Briefing

A small Node.js/TypeScript tool that builds a personal morning briefing from:

- recent Git activity from a local repository
- Bremen weather
- general news
- AI news

The briefing is generated with a local Ollama model and sent by email through Microsoft Graph.

## Requirements

- Node.js 20+
- Git
- Ollama

## Setup

Install dependencies:

```powershell
npm install
```

Configure the default Ollama model in `package.json`:

```json
"config": {
  "default_model": "qwen3.5:9b"
}
```

Create a `.env` file with the Microsoft Graph settings used for email delivery:

```env
MS_CLIENT_ID=...
MS_TENANT_ID=...
BRIEFING_RECIPIENTS=you@example.com,colleague@example.com
```

## Run the briefing

```powershell
npm run briefing -- <repository-path> [model] [main-days] [branch-days]
```

Examples:

```powershell
# Default model, 1 day for main and active branches
npm run briefing -- "D:\develop\next-wk\nextjs"

# Default model, 7 days for both Git windows
npm run briefing -- "D:\develop\next-wk\nextjs" 7

# Default model, 7 days for main and 30 days for active branches
npm run briefing -- "D:\develop\next-wk\nextjs" 7 30

# Override the model
npm run briefing -- "D:\develop\next-wk\nextjs" llama3.1:8b

# Override everything
npm run briefing -- "D:\develop\next-wk\nextjs" qwen3.5:9b 14 50
```

If `branch-days` is omitted, it uses the same value as `main-days`.

## Useful Ollama commands

```powershell
ollama list
ollama pull qwen3.5:9b
ollama ps
ollama stop qwen3.5:9b
```
