# Task 3 — Telegram Learning Quiz Bot: Report

## Tools and Techniques Used

**n8n** — the entire bot is built as a single n8n workflow. n8n handles the Telegram webhook trigger, message routing, AI agent orchestration, data storage, and all HTTP communication. No custom backend code was written outside of n8n Code nodes.

**Telegram Bot API** — the bot receives messages and callback queries via n8n's `telegramTrigger` node, which registers a webhook automatically when the workflow is activated. Telegram's inline keyboard feature is used to let users select quiz topics and submit answers by tapping buttons rather than typing.

**HTTP Request node** — used in two places:
1. To fetch the raw HTML of the URL submitted with `/learn`. The response is passed to a Code node that strips tags and extracts clean plaintext for the AI agents.
2. To send Telegram messages that include dynamic inline keyboards. The built-in Telegram send node in n8n does not support programmatically constructed `reply_markup` objects, so all keyboard-bearing messages are sent as raw `POST` requests to `api.telegram.org/sendMessage` with a JSON body assembled in Code nodes.

**DataTables** — n8n's built-in DataTable nodes serve as the persistent data store. Two tables are used:
- `learning_materials`: stores the URL, extracted content, AI-generated title, summary bullet points, main concepts, difficulty level, user ID, and timestamp for each saved article.
- `quizzes`: stores one row per quiz question, including the question text, options, correct answer, explanation, question index, user's selected answer, correctness flag, feedback, and session ID.

**Teacher AI Agent** — an n8n LangChain Agent node backed by OpenAI `gpt-5-mini`. Its role is to analyze the extracted article text and produce a structured summary: 5–7 key points, a list of main concepts, and a difficulty classification. A structured output parser enforces typed JSON output. The difficulty prompt includes an explicit three-level rubric (beginner / intermediate / advanced) to prevent the model from defaulting to "intermediate" for everything.

**Examiner AI Agent** — a second LangChain Agent node, also backed by `gpt-5-mini`, with a separate model instance to keep its context isolated from the Teacher. Its role is to generate five unique multiple-choice questions derived from the saved material's content and main concepts. Questions are not hardcoded — they are generated fresh each time from the specific article. A structured output parser enforces a consistent question schema.

**Examiner Validate Answer Agent** — a third model instance used specifically for answer validation. Rather than comparing the user's selected letter against the stored correct answer with a string match, this agent receives the question, all options, the correct answer key, and the user's selection, and returns a semantic judgment. This allows it to confirm correctness even if there is minor phrasing variation, and to generate a short explanation when the user is wrong.

**quizSessionId** — each quiz session is assigned a unique ID (`quiz-<timestamp>`) at the moment the five questions are generated and stored. All five question rows share this session ID. When the user answers a question, the answer is written back to the matching row using the session ID + question ID as the lookup key. This design allows a user to retake a quiz on the same material multiple times without previous sessions' answers being overwritten, since each session produces its own set of rows.

---

## What Worked

- Structured output parsers kept AI responses consistently typed across all three agents, eliminating the need to defensively parse free-form text.
- Inline keyboard callback routing using colon-separated data (`quiz:<id>`, `answer:<sessionId>:<questionId>:<letter>`) was reliable and stayed within Telegram's 64-byte callback data limit.
- AI-based answer validation correctly handled cases where the user's selected option was semantically right even when the letter did not match expectations, making the quiz feel fair.
- DataTable persistence meant users could return after days and still access all saved materials via `/quiz`.
- The explicit difficulty rubric in the Teacher prompt produced meaningful, varied difficulty labels rather than uniform "intermediate" output.

---

## What Did Not Work

- **Long articles** — very long pages are passed in full to the AI agent prompt, which can exceed the model's effective context. Summaries for long articles sometimes only reflect the beginning of the content. Chunking or truncation to a character limit was not implemented.
- **No URL deduplication** — if a user submits the same URL twice, two separate records are created in `learning_materials`. A check-before-insert step was considered but left out to keep the flow straightforward.
- **DataTable filtering constraints** — the DataTable node's filter options are limited. Filtering by session ID AND a numeric "greater than" index for finding the next question required careful node ordering and occasional workarounds.

---

## Why HTTP Request Was Used for Inline Keyboards

n8n's built-in Telegram send node supports static inline keyboards defined at design time in the node UI, but it does not support keyboards where the button text and callback data are assembled dynamically at runtime from Code node output. Because both the quiz topic menu and the per-question answer buttons are built from live DataTable records, the keyboard structure is only known at execution time. To send these dynamic keyboards, Code nodes assemble the full Telegram payload as a JSON string (`body_json`), and HTTP Request nodes POST it directly to the Telegram Bot API endpoint. This bypasses the n8n node's keyboard limitation entirely and gives full control over the `reply_markup` structure.
