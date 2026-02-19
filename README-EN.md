[中文](README.md) | English

# Liar's Dice (大话骰)

A desktop Liar's Dice game built with Tauri v2 where a human player faces an AI in a 1v1 match.

## Game Overview

Liar's Dice is a classic dice bluffing game. Each player has five 6-sided dice and only sees their own dice. Players take turns making claims about how many dice of a certain face value exist among all dice.

## Rules

- Two players, each with five 6-sided dice
- At the start of each round both players roll and only see their own dice
- Players take turns making bids: claim "there are at least X dice showing face Y among all dice"
- The next player must raise the bid (higher quantity or higher face when quantity is equal) or call "liar" (challenge)
  - Raise rule: higher quantity, or same quantity but higher face
- When challenged, all dice are revealed:
  - If actual count >= bid → bidder wins (challenger loses)
  - If actual count < bid → challenger wins (bidder loses)
- The loser loses one die; the game ends when a player has no dice left

## Tech Stack

- Backend: Rust (Tauri v2) — game engine, AI decision logic, rule enforcement
- Frontend: React + TypeScript + Vite — UI rendering and user interaction
- Styling: Tailwind CSS

## Project Structure

```
├── src/                    # React frontend source
│   ├── components/         # UI components
│   │   ├── GameBoard.tsx   # Main game UI
│   │   ├── DiceView.tsx    # Dice visualization
│   │   ├── BidPanel.tsx    # Bid controls
│   │   ├── BidHistory.tsx  # Bid history
│   │   ├── ScoreBoard.tsx  # Remaining dice
│   │   └── ResultModal.tsx # Result modal
│   ├── api.ts              # Tauri API wrapper
│   ├── types.ts            # TypeScript types
│   └── App.tsx             # App entry
├── src-tauri/              # Rust backend source
│   └── src/
│       ├── game/           # Game logic
│       │   ├── types.rs    # Game type definitions
│       │   ├── engine.rs   # Game engine
│       │   └── ai.rs       # AI decision engine
│       ├── commands.rs     # Tauri commands
│       └── lib.rs          # Library entry
└── docs/                   # Documentation
    └── plans/              # Design & planning
```

## Architecture

```
┌──────────────────────────────────┐
│         React Frontend           │
│  GameBoard / DiceView / BidPanel │
│              │ invoke()          │
├──────────────┼───────────────────┤
│         Tauri Commands           │
├──────────────┼───────────────────┤
│         Rust Backend             │
│  GameEngine / AI Engine / Judge  │
└──────────────────────────────────┘
```

## AI Strategy

The AI uses probabilistic reasoning:

- AI knows its own dice
- Opponent dice are treated as uniform (1/6 per face)
- Uses binomial distribution to compute the probability of "at least X dice of face Y"
- If probability exceeds a threshold → raise; otherwise → call liar

## Development Guide

### Requirements

- Node.js 18+
- pnpm
- Rust (via rustup)
- Tauri CLI v2

### Install dependencies

```bash
pnpm install
```

### Development

```bash
pnpm tauri dev
```

### Run tests

```bash
cd src-tauri && cargo test
```

### Build

```bash
pnpm tauri build
```

## Recommended IDE Setup

- VS Code
- Tauri extension
- rust-analyzer

## License

MIT
