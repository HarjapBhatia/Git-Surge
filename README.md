# git-surge

> A command-line tool to discover trending GitHub repositories — powered by the GitHub Search API, with optional AI-powered natural language querying via Google Gemini.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [Normal Mode](#normal-mode)
  - [AI Mode](#ai-mode)
  - [All Options](#all-options)
- [How It Works](#how-it-works)
  - [GitHub API](#github-api)
  - [AI Integration](#ai-integration)
  - [API Key Storage](#api-key-storage)
- [Project Structure](#project-structure)
- [Error Handling](#error-handling)
- [License](#license)

---

## Overview

`git-surge` is a CLI tool that fetches and displays trending GitHub repositories for any time range — today, this week, this month, or this year. It presents results in a clean, color-coded terminal output showing repository name, description, star count, and programming language.

It supports two modes of operation:

- **Normal mode** — use standard flags like `--duration` and `--limit`
- **AI mode** — type a plain English query and let Google Gemini extract the parameters for you

---

## Features

- Fetches trending repositories using the GitHub Search API
- AI-powered natural language querying via Google Gemini
- Filter by time range: `day`, `week`, `month`, or `year`
- Control how many results to display (up to 100)
- Clean, color-coded terminal output
- Secure local API key storage — enter once, never asked again
- No authentication required for GitHub (public repos only)
- Robust error handling for network, API, and input errors

---

## Requirements

- **Node.js v18 or higher** (uses built-in `fetch`)
- **npm** (comes with Node.js)
- A free **Google Gemini API key** (only required for AI mode)

Check your Node version:
```bash
node --version
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/harjapbhatia/git-surge.git
cd git-surge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Link globally (so you can run `git-surge` from anywhere)

```bash
npm link
```

To unlink later:
```bash
npm unlink -g git-surge
```

---

## Usage

### Normal Mode

Use standard CLI flags to specify your query:

```bash
# Default: top 10 repos from the past week
git-surge

# Top 5 repos trending today
git-surge --duration day --limit 5

# Top 20 repos from the past month
git-surge --duration month --limit 20

# Top 15 repos from the past year (short flags)
git-surge -d year -l 15
```

### AI Mode

Pass a plain English query as a string — Gemini will extract the duration and limit automatically:

```bash
git-surge "show me 10 trending repos from last month"
git-surge "top 5 repos today"
git-surge "give me 25 repos from this year"
git-surge "last month 10 repos"
```

**First time using AI mode**, you will be prompted to enter your Gemini API key:

```
   Gemini API key not found.
   Get a free key at: https://aistudio.google.com
   (Free tier: 1500 requests/day)

   Enter your API key: █
```

The key is saved locally and you will never be asked again. To reset it:

```bash
git-surge --reset-key
```

### All Options

| Flag | Short | Description | Default |
|---|---|---|---|
| `--duration <time>` | `-d` | Time range: `day`, `week`, `month`, `year` | `week` |
| `--limit <number>` | `-l` | Number of repos to display (1–100) | `10` |
| `--reset-key` | | Remove saved Gemini API key | |
| `--help` | `-h` | Show help message | |
| `--version` | `-V` | Show version number | |

### Example Output

```
   Trending GitHub Repositories — this month
   Repos after 2025-01-15 · Showing top 10 of 12,483 results
──────────────────────────────────────────────────────────────────────

 1. someuser/awesome-ai-tool
    A blazing fast AI toolkit for developers
    ⭐ 12.4k   • TypeScript   https://github.com/someuser/awesome-ai-tool

 2. anotherdev/fast-cli
    The simplest CLI framework for Node.js
    ⭐ 8.1k   • JavaScript   https://github.com/anotherdev/fast-cli

──────────────────────────────────────────────────────────────────────
   10 repositories displayed.
```

---

## How It Works

### GitHub API

GitHub does not have an official "trending" endpoint, but the Search API replicates it perfectly:

```
GET https://api.github.com/search/repositories
  ?q=created:>YYYY-MM-DD
  &sort=stars
  &order=desc
  &per_page=LIMIT
```

The date cutoff (`created:>DATE`) is calculated dynamically based on the `--duration` flag:

| Duration | Days subtracted |
|---|---|
| `day` | 1 day |
| `week` | 7 days |
| `month` | 30 days |
| `year` | 365 days |

Results are sorted by **star count** in descending order — most starred repositories appear first.

No GitHub authentication is required for public repository searches. The unauthenticated rate limit is 10 requests per minute, which is more than sufficient for normal use.

### AI Integration

When a plain string is passed instead of flags, `git-surge` sends the query to the **Google Gemini API** with a carefully constructed prompt that instructs the model to extract exactly two values: `duration` and `limit`.

The prompt maps natural language time expressions to the four supported durations:

| User says | Extracted duration |
|---|---|
| "today", "24 hours", "1 day" | `day` |
| "this week", "7 days", "few days" | `week` |
| "this month", "30 days", "few weeks" | `month` |
| "this year", "365 days", "few months" | `year` |

Gemini returns a raw JSON object like `{"limit": 10, "duration": "month"}`, which is then validated and passed directly to the same GitHub API fetching logic used in normal mode. The AI layer only affects parameter extraction — everything else remains identical.

### API Key Storage

The Gemini API key is stored locally on the user's machine at:

```
~/.git-surge/config.json
```

This file is created automatically the first time AI mode is used. It is stored outside the project directory so it is never accidentally committed to version control. The `.gitignore` in this project also excludes `.env` files as an additional safeguard.

To reset the key at any time:
```bash
git-surge --reset-key
```

---

## Project Structure

```
git-surge/
│
├── index.js          ← Entry point — routes between AI mode and normal mode
├── package.json      ← Project metadata, dependencies, CLI bin config
├── LICENSE           ← MIT License
├── README.md         ← This file
│
└── src/
    ├── args.js       ← Parses CLI flags and detects AI mode vs normal mode
    ├── api.js        ← GitHub Search API call with full error handling
    ├── ai.js         ← Sends query to Gemini, extracts { duration, limit }
    ├── config.js     ← Reads and writes Gemini API key to ~/.git-surge/
    └── format.js     ← Terminal output formatting with chalk colors
```

### Data Flow

```
Normal mode:
  git-surge --duration month --limit 20
      └── args.js ──► api.js ──► format.js

AI mode:
  git-surge "20 repos from last month"
      └── args.js ──► config.js (get key)
                  └── ai.js (parse query)
                  └── api.js ──► format.js
```

---

## Error Handling

`git-surge` handles errors at every layer:

| Error | Message |
|---|---|
| No internet connection | `Network error — are you connected to the internet?` |
| GitHub rate limit (60 req/hr) | `GitHub API rate limit exceeded. Please try again later.` |
| Invalid query params | `GitHub API rejected the request (422).` |
| Invalid Gemini API key | `Invalid or expired Gemini API key. Use --reset-key to set a new one.` |
| Gemini rate limit | `Gemini API rate limit hit. Please wait a moment and try again.` |
| No repos found | `No trending repositories found. Try a longer --duration.` |
| Invalid --duration value | `Invalid duration. Valid options are: day, week, month, year` |
| Invalid --limit value | `Invalid limit. Please provide a number between 1 and 100.` |

---

## License

This project is licensed under the [MIT License](LICENSE).

