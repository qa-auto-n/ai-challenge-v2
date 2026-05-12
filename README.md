# ai-challenge-v2

This repository contains my implementation for the challenge tasks.

## Task 1

`task-1/` contains a static leaderboard implementation built with plain HTML, CSS, and JavaScript.

### Run locally

From the repository root:

```bash
cd task-1
python3 -m http.server 4173
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

### Deployment

The repository includes a GitHub Pages workflow that deploys the contents of `task-1/`.

## Task 2

`task-2/community-pass-hub/` contains a full-stack event hosting and attendance platform built with Lovable, React, TanStack Router, and Supabase.

- **Live app**: deployed via Lovable to Cloudflare Pages (URL in submission)
- **Usage guide**: [`task-2/README.md`](task-2/README.md)
- **Development report**: [`task-2/report.md`](task-2/report.md)

## Task 3

`task-3/` contains a Telegram bot that learns from article URLs and quizzes users on the content, built as an n8n workflow with OpenAI AI agents.

- **Bot link**: [https://t.me/smartLearning_bot](https://t.me/smartLearning_bot)
- **Usage guide**: [`task-3/README.md`](task-3/README.md)
- **Development report**: [`task-3/report.md`](task-3/report.md)
- **Workflow export**: [`task-3/workflow.json`](task-3/workflow.json)
