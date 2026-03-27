# Automated AI WhatsApp Sales System

A robust, 24/7 automated sales agent that finds leads on Google Maps, messages them via WhatsApp, chats using AI, and presents website demos.

## 📁 Repository Structure

- `/dashboard`: Premium React+Vite Admin Dashboard to monitor leads.
- `/n8n`: Documentation for building the n8n automation workflows.
- `/docs`: Database schemas and API integration keys instructions.
- `docker-compose.yml`: For deploying n8n to Render.

## 🚀 Deployment Instructions

### 1. Deploy n8n (Backend Automation)
We use Render's Docker deployment to run n8n 24/7.
1. Create a new "Web Service" on [Render](https://render.com).
2. Connect this repository (or define the docker-compose).
3. Add a PostgreSQL database on Render.
4. Add the environment variables from `docker-compose.yml` replacing `${DB_HOST}` etc. with your actual DB credentials.
5. Deploy. n8n will restart safely on crashes.

### 2. Deploy Dashboard (Frontend)
1. Push this repository to GitHub.
2. Import the `/dashboard` folder into [Vercel](https://vercel.com) or Netlify.
3. Framework preset: `Vite`.
4. Deploy.

### 3. Run Locally (Dashboard)
```bash
cd dashboard
npm install
npm run dev
```

## Security & Scalability
- **Rate Limits:** The system sends max 30 messages a day via the n8n schedule trigger to avoid WhatsApp bans.
- **Fail-safes:** Leads are marked `MessageSent = TRUE` before sending to prevent duplicates on crash recovery.
