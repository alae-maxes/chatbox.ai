# AI Flow — Workflow Automation Platform

A modern, browser-based AI automation web app inspired by n8n and Make. Built with pure HTML, CSS, and JavaScript — no frameworks, no build step. Ready for GitHub Pages deployment.

## Features

- **Drag-and-Drop Workflow Builder** — Visual node-based automation builder with 12 node types
- **AI Agent** — Configurable AI agent powered by Google Gemini API (supports Gemini 2.0 Flash, 2.0 Pro, 1.5 Pro, 1.5 Flash)
- **AI Chat** — Multi-conversation AI chat interface with conversation history
- **Webhooks** — Incoming HTTP webhook triggers
- **HTTP Requests** — Make API calls to any REST endpoint
- **Gmail** — Send emails via Gmail API
- **Telegram** — Send messages via Telegram Bot API
- **WhatsApp** — Send messages via WhatsApp Business API
- **Google Sheets** — Read and write spreadsheet data
- **Database** — Query database connections
- **Workflow History** — Track all workflow executions with status and duration
- **Authentication** — User registration/login with LocalStorage-based session management
- **Dark Mode** — Full light/dark theme toggle
- **Responsive Design** — Works on desktop, tablet, and mobile

## Quick Start

1. Open `index.html` in any browser
2. Register a new account (LocalStorage-based, no backend needed)
3. Add your Google Gemini API key in **AI Agent** settings
4. Start building workflows in the **Builder** tab

## Project Structure

```
ai-automation/
├── index.html              # Main HTML entry point
├── assets/
│   ├── css/
│   │   ├── main.css        # Core styles (light theme, layout, components)
│   │   ├── themes.css      # Dark mode theme variables
│   │   └── responsive.css  # Responsive breakpoints
│   └── js/
│       ├── storage.js      # LocalStorage persistence layer
│       ├── toast.js        # Toast notification system
│       ├── auth.js         # Authentication & session management
│       ├── workflows.js    # Workflows list view (CRUD)
│       ├── builder.js      # Drag-and-drop workflow builder
│       ├── agent.js        # AI Agent configuration & test chat
│       ├── chat.js         # Multi-conversation AI chat
│       ├── history.js      # Workflow run history
│       ├── integrations.js # Integration management cards
│       ├── gemini-api.js   # Google Gemini API client
│       └── app.js          # App orchestration & navigation
```

## Node Types (12)

| Category | Nodes |
|----------|-------|
| Triggers | Webhook, Schedule |
| AI | AI Agent, AI Chat |
| Communication | Gmail, Telegram, WhatsApp |
| Data | Google Sheets, HTTP Request, Database |
| Logic | Condition, Loop |

## Tech Stack

- HTML5
- CSS3 (custom properties, flexbox, grid, animations)
- Vanilla JavaScript (ES6+)
- LocalStorage for persistence
- Google Gemini REST API v1beta

## Deployment

Zero build step — deploy directly to GitHub Pages or any static hosting:

```bash
# Just upload the ai-automation/ folder
# Or serve locally:
python -m http.server 8000
```

## Notes

- All data is stored in the browser's LocalStorage — no backend required
- API keys are stored locally and never transmitted to any server other than Google's Gemini API
- The integration connections are simulated in the UI for demonstration purposes
