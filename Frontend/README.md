# Vacations — Frontend (React + TypeScript + Vite)

The full project guide is in the main [README](../README.md).

```bash
npm install
npm run dev       # http://localhost:5173 (the server must run on http://localhost:3001)
npm run build     # production build → dist/
npm run lint      # oxlint
```

The server address comes from `VITE_API_URL` (default `http://localhost:3001`).
In Docker it is `/api`, and nginx forwards it to the server (`nginx.conf`).

```
src/
  pages/        one component per page (Vacations, AddVacation, EditVacation, Reports, AiRecommendation, McpAssistant, …)
  components/   Navbar, VacationCard, VacationForm, FilterBar, Pagination, ConfirmDialog, route guards
  contexts/     UserContext (the logged-in user) + UserProvider
  types/        TypeScript interfaces
  utils/        api, validation, format, homePath
```
