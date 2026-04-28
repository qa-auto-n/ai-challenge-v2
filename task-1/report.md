# Task 1 Report

## Approach

I rebuilt the leaderboard as a static GitHub Pages app using plain HTML, CSS, and JavaScript. I chose a static implementation because the assignment is primarily a UI and interaction cloning task, and GitHub Pages deployment is simplest with a dependency-free frontend.

The reference leaderboard was used only as a visual and structural reference:

- overall layout and spacing
- filter bar with year, quarter, category, and search
- top-3 podium presentation
- ranked card list with category indicators, total score, and expandable details
- manual visual comparison of individual UI parts from screenshots, moving element by element from the top of the page downward

I did **not** reuse source content in the final app.
The implementation was driven by manually sanitized screenshots and element-by-element reconstruction, rather than by copying source records or reusing source labels.

## Tools And Techniques

- AI-assisted planning and implementation using Claude Code in an IDE
- visual matching from screenshots
- element-by-element reconstruction from the top of the page downward using sanitized screenshots
- synthetic dataset generation in JavaScript
- plain CSS for recreating the soft card-based look, podium blocks, expanded rows, and responsive layout

## Data Replacement

Because the final page needed to function as a leaderboard, I used fictional professional-themed data:

- names → fictional person names
- titles/roles → fictional professional roles
- group labels → fictional teams or units
- activity text → fictional professional activities generated from templates
- avatars → locally generated non-source portrait placeholders used only to preserve the visual structure of the leaderboard

The goal was to preserve the structure and behavior of the leaderboard while ensuring that the final output contains only replacement content created for this task.
