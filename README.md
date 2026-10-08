# Freebuff Server

Express + TypeScript backed by **MongoDB Atlas (cloud)**, with a static list frontend.

## Setup

```bash
npm install
cp .env.example .env    # Windows: copy .env.example .env
```

Then paste your Atlas connection string into `.env`:

```
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=freebuff
PORT=3000
```

Getting that string: MongoDB Atlas → your cluster → **Connect** → **Drivers** → pick Node.js → copy the URI.
Remember to allow your IP under **Network Access** (or `0.0.0.0/0` for quick local testing).

Lost the database-user password? Atlas → **Database Access → Database Users** → edit `frame_db_user` →
set a new password → paste it URL-encoded into `.env`.

`.env` is gitignored — never commit the real URI.

## Run

```bash
npm run dev     # nodemon: rebuild + restart on changes
npm run build   # tsc -> dist/   (npm run build is `tsc`)
npm start       # run dist/index.js
```

The server starts only after a successful database connection.

### Offline dev (no Atlas needed)

If `MONGODB_URI` is missing or still the `.env.example` placeholder, the server prints a loud warning and
boots an **ephemeral local in-memory MongoDB** (via the `mongodb-memory-server` devDependency) so
`npm run dev` works immediately. Data is lost on every restart and never reaches Atlas.

Set `NODE_ENV=production` and the fallback is disabled — production refuses to start without a real URI.

## API

| Method | Route          | Body           | Result             |
| ------ | -------------- | -------------- | ------------------ |
| GET    | `/api/items`   | –              | list, newest first |
| POST   | `/api/items`   | `{ text }`     | created item (201) |

Documents live in the `items` collection of the `MONGODB_DB` database:

```js
{ _id: ObjectId, text: string, createdAt: Date }
```

## Frontend

`public/` is served statically by Express at `http://localhost:3000`. The page just loads the list and
posts new items — all MongoDB access stays on the server, since a browser cannot connect to Atlas
directly (no driver, and the credentials must never ship to the client).

## Tests

```bash
npm test        # runs src/Test1.ts via ts-node
```
