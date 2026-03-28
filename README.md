# Daily Mood Tracker

A privacy-first mood tracking app that runs entirely in your browser. Log how you feel each day using a simple color-coded system, then look back at your weeks, months, and year to spot patterns in your emotional well-being.

## Link
https://daily-mood-tracker-blue.vercel.app/

## App Screenshot
<img width="1509" height="819" alt="Screenshot 2026-03-18 at 11 17 15" src="https://github.com/user-attachments/assets/093c01b7-6833-4ea1-baa2-04190e9d4ccc" />

## Features

- **Daily mood logging** — Pick from five mood levels (Great, Good, Okay, Bad, Awful), each mapped to a distinct color
- **Split-day tracking** — Optionally record two moods per day to capture morning vs. afternoon shifts
- **Notes** — Attach a short note to any day for extra context
- **Year-at-a-glance grid** — A color-coded 12×31 / 31×12 grid showing every day of the year at once, with a toggleable orientation
- **Monthly charts** — Stacked bar chart showing mood distribution by month
- **Mood accumulation table** — Heat-mapped table of mood counts per month with yearly totals
- **Insight pills** — Automatic highlights for your best and toughest months, plus total days tracked
- **Multi-year support** — Navigate between years to review past data
- **Click any day** — Tap a cell in the year grid to view or edit that day's entry
- **Backup & restore** — Export all data to JSON and import it back, with smart merge and per-entry conflict resolution for notes
- **Fully offline** — All data stays in your browser's localStorage. No accounts, no servers, no tracking

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev server and builds
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Framer Motion](https://motion.dev/) for animations
- [Recharts](https://recharts.org/) for charts
- [Headless UI](https://headlessui.com/) for accessible menus and modals

## Getting Started

```bash
# Clone the repo
git clone https://github.com/jorge-ramirez/Daily-Mood-Tracker.git
cd Daily-Mood-Tracker/client

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Scripts

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `npm run dev`    | Start the development server |
| `npm run build`  | Build for production         |
| `npm run lint`   | Run ESLint                   |
| `npm run test`   | Run unit tests               |

## Deployment

The app is deployed on [Vercel](https://vercel.com/) as a static SPA from the `client/dist` directory.
