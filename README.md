# Custom Web Login System

**Live demo:** https://kazin.dev/projects/custom-web-login-system/

A complete sign-up / sign-in flow written from scratch: no auth library does the work, every step (accounts, sessions, email verification, Google sign-in) is implemented by hand on a small React + Express + MySQL stack.

## What it does

- **Register and sign in** with email and password; server-side validation of the fields and of the email format.
- **Email verification**: a new account stays unverified until the link sent to the address is opened.
- **Sign in with Google** as an alternative to the form.
- **Sessions** kept by the server (a UUID per session, cookie on the client) so a refresh or a direct URL keeps the user signed in.
- **Dashboard and profile** pages behind the login, with a collapsible sidebar; user roles prepared in the schema.

## Built with

| Layer | Technologies |
| --- | --- |
| Front end | React 18, React Router 6, Material UI, Bootstrap 5, styled-components, axios, `@react-oauth/google` |
| Back end | Node.js, Express 4, express-session, cookie-parser, Passport (Google OAuth), uuid |
| Database | MySQL 8 (`database.sql`: users, sessions, roles, verification flag) |
| Tooling | Create React App, nodemon |

## Run it

```bash
# terminal 1
cd client && npm i && npm start
# terminal 2
cd server && npm i && npm start
```

Import `database.sql` into MySQL first and put your Google OAuth client id in `client/src/google-credentials.js` and `server/google-credentials.js`.

---

## Original README (2024-05-19, c244590)

- First console:

cd client<br>
npm i<br>
npm start

- Second console:
  
cd server<br>
npm i<br>
npm start<br>
