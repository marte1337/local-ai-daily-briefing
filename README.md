# Local Daily Briefing

A small local-AI morning briefing that combines:

- recent Git activity from a local repository
- current weather for Bremen
- general news
- AI news, including estimated article reading times
- email delivery through Microsoft Graph

The briefing is generated locally with an Ollama model.

## Requirements

- Node.js 20+
- Git
- Ollama
- A Microsoft Entra app registration with delegated `Mail.Send` permission if email delivery is enabled

## Setup

Clone the repository and install dependencies:

```powershell
npm install
```

Create your local environment file from the example:

```powershell
copy .env.example .env
```

Configure `.env`:

```env
BRIEFING_MODEL=qwen3.5:9b
BRIEFING_REPO=D:/path/to/your/repository

MS_CLIENT_ID=
MS_TENANT_ID=
BRIEFING_RECIPIENTS=you@example.com
```

`BRIEFING_RECIPIENTS` can contain multiple comma-separated email addresses.

The `.env` file is local configuration and should not be committed.

## Run the briefing

Use the configured repository, model, and default one-day Git windows:

```powershell
npm run briefing
```

Use a custom Git window for both main and active branches:

```powershell
npm run briefing -- 20
```

Use separate windows for main and active branches:

```powershell
npm run briefing -- 20 60
```

Override the configured model:

```powershell
npm run briefing -- llama3.1:8b
```

Override the model and Git windows:

```powershell
npm run briefing -- llama3.1:8b 20 60
```

The arguments are:

```text
npm run briefing -- [model] [main-days] [branch-days]
```

- `model` is optional and defaults to `BRIEFING_MODEL`.
- `main-days` is optional and defaults to `1`.
- `branch-days` is optional and defaults to the `main-days` value.
- The repository path comes from `BRIEFING_REPO`.

Because a numeric first argument is interpreted as `main-days`, the model can be omitted when only changing the Git windows.

## Ollama

Make sure the configured model is installed:

```powershell
ollama list
```

To download a model:

```powershell
ollama pull qwen3.5:9b
```

## Email authentication

The first email run may ask you to sign in through Microsoft's device-code flow. Authentication is then cached locally for later runs when possible.
