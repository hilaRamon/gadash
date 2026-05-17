# Gadash

Full-stack monorepo with a React (Vite + TypeScript) frontend and a Node.js (Express + TypeScript) backend.

## Project structure

```
.
├── client/          # React frontend (Vite + TypeScript)
├── server/          # Express backend (TypeScript)
├── package.json     # Root scripts to run client, server, or both
├── .gitignore
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (included with Node.js)

## Installation

From the project root, install dependencies for the root workspace, client, and server:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

Or run all three in one line:

```bash
npm install && npm install --prefix client && npm install --prefix server
```

## Development

| Command | Description |
|---------|-------------|
| `npm run client` | Start the Vite dev server (frontend only) |
| `npm run server` | Start the Express API with hot reload via ts-node-dev |
| `npm run dev` | Start both client and server concurrently |

### URLs

- **Frontend:** http://localhost:5173 (default Vite port)
- **Backend:** http://localhost:3001 (default; set `PORT` to override)

## Production builds

**Client**

```bash
cd client
npm run build
npm run preview
```

**Server**

```bash
cd server
npm run build
npm start
```

## Tech stack

- **Client:** React, Vite, TypeScript, Axios
- **Server:** Node.js, Express, TypeScript, CORS, ts-node-dev
