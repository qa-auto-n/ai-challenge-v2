# SmartLearningBot — Telegram Learning & Quiz Bot

**Bot link: https://t.me/smartLearning_bot**

A Telegram bot that reads any article URL, summarizes it with AI, and quizzes you on what you learned.

---

## Commands

| Command | Description |
|---|---|
| `/start` | Show the welcome message and list of commands |
| `/learn [url]` | Fetch an article, generate a summary, and save it |
| `/quiz` | Pick a saved topic and start a quiz |

---

## How to Use `/learn`

1. Send the command with a URL:
   ```
   /learn https://example.com/some-article
   ```
2. The bot fetches the page, extracts the text, and runs it through the Teacher AI agent.
3. It replies with:
   - A title
   - 5–7 key bullet points
   - Main concepts covered
   - Difficulty level (beginner / intermediate / advanced)
4. The material is saved to your personal topic list for future quizzes.

---

## How to Start a Quiz via `/quiz`

1. Send `/quiz`.
2. The bot shows a list of all your saved topics as inline buttons, each labeled with the title and difficulty level.
3. Tap a topic to start a quiz on it.
4. Five multiple-choice questions are sent one at a time, each with four answer buttons (A, B, C, D).
5. Tap your answer — the bot moves to the next question automatically.
6. After the fifth answer, the bot sends a full results summary with your score and per-question feedback.

---

## How to Use the Inline "Take Quiz" Button

After `/learn` completes, a **Take Quiz** button appears directly below the summary. Tap it to start a quiz on that material immediately — no need to go through `/quiz` and pick a topic manually.

The quiz flow is identical: five questions, one at a time, with a score summary at the end.

---

## Notes

- Your saved topics and quiz sessions persist between conversations — you can return any time and use `/quiz` to access previously learned material.
- The bot does not require a restart between commands.
- Pages built with heavy client-side JavaScript (React, Angular, etc.) may produce incomplete summaries, since the bot fetches raw HTML without a browser engine.
