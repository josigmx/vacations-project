# Database — MongoDB export

Database name: **`vacationsDB`** · 3 collections, exported with `mongoexport --jsonArray`:

| File | Collection | Documents |
|---|---|---|
| `users.json` | users (passwords stored as bcrypt hashes) | 7 (1 admin + 6 users) |
| `vacations.json` | vacations (the image file name only — the photos are in `Backend/seed-images/`) | 14 |
| `likes.json` | likes — which user liked which vacation (`userId` → users, `vacationId` → vacations) | 35 |

## Import

```bash
mongoimport --db vacationsDB --collection users     --jsonArray --file users.json
mongoimport --db vacationsDB --collection vacations --jsonArray --file vacations.json
mongoimport --db vacationsDB --collection likes     --jsonArray --file likes.json
```

Then copy the photos: `cp ../Backend/seed-images/*.jpg ../Backend/images/`

## Or simply

- **Docker:** `docker compose up -d --build` — the server fills an empty database with the same data on its first start.
- **Local:** `cd Backend && npm run seed` — resets the database to this data, with the dates counted from today
  (so there are always ended, active and upcoming vacations).

The dates in this export are fixed to the day it was made (2026-11-05).
