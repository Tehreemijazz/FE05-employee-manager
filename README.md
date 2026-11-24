# Employee Manager

React + Vite + Axios app that talks to the [DummyJSON](https://dummyjson.com) REST API.

## Run
```bash
npm install
cp .env.example .env
npm run dev
```

## Features
List, search, filter by department, sort by column, client-side pagination, create (POST), update (PUT), delete (DELETE), loading and error states.

## Notes
DummyJSON simulates writes and does not persist them, so the UI updates its local state after a successful response.
Employees created in the session exist only locally, so editing or deleting them skips the API call.

## Structure
- `src/api/client.js` Axios instance, env config, error messages
- `src/api/employees.js` reusable API functions
- `src/App.jsx` UI and state
