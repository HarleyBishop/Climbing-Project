# Deployment Guide - Climbing App

This guide covers deploying the climbing app to **Render** (backend) and **Vercel** (frontend).

---

## Architecture Overview

- **Backend**: Django REST API on Render with free PostgreSQL database
- **Frontend**: React/Vite SPA on Vercel
- **Database**: PostgreSQL on Render (10GB free tier)
- **Authentication**: JWT tokens + Google OAuth

Both services integrate directly with GitHub for automatic deployments on git push.

---

## Prerequisites

1. GitHub account with your repo pushed
2. Render account (free) — https://render.com
3. Vercel account (free) — https://vercel.com
4. Google Cloud OAuth app (for Google Sign-In)

---

## Backend Setup (Render)

### Step 1: Create PostgreSQL Database on Render

1. Log into Render dashboard
2. Click **New +** → **PostgreSQL**
3. Choose a name (e.g., `climbing-app-db`)
4. Select **free tier**
5. Click **Create Database**
6. Note the `DATABASE_URL` (connection string) — you'll need this

### Step 2: Create Web Service on Render

1. Click **New +** → **Web Service**
2. Select **Connect your repository** → choose your GitHub repo
3. Configure:
   - **Name**: `climbing-api` (or your choice)
   - **Region**: Your closest region
   - **Branch**: `master` (or your main branch)
   - **Runtime**: `Python 3`
4. Click **Create Web Service**

### Step 3: Add Environment Variables to Render

In the Render dashboard for your service, go to **Environment** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DEBUG` | `False` | Disable debug mode in production |
| `SECRET_KEY` | `<generate-new>` | Generate via: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` — **do not use the one from .env** |
| `GOOGLE_CLIENT_ID` | `<from-google-cloud>` | New OAuth app credentials (see step 4 below) |
| `ALLOWED_HOSTS` | `<your-render-domain>.onrender.com` | Will be assigned by Render (format: `climbing-api.onrender.com`) |
| `CORS_ALLOWED_ORIGINS` | `https://<your-vercel-domain>.vercel.app` | Your Vercel frontend domain |
| `DATABASE_URL` | `<from-postgresql-database>` | Provided by Render when you created the database |

### Step 4: Google OAuth Setup

1. Go to **Google Cloud Console** → https://console.cloud.google.com/
2. Create a **new OAuth 2.0 Client ID** (or use existing):
   - Application type: **Web application**
   - Add authorized JavaScript origins:
     - `https://<your-vercel-domain>.vercel.app`
   - Add authorized redirect URIs:
     - `https://<your-render-domain>.onrender.com`
     - `https://<your-render-domain>.onrender.com/api/auth/google/`
3. Copy the **Client ID** and add to Render environment as `GOOGLE_CLIENT_ID`

### Step 5: Deploy

Render automatically deploys when you push to GitHub. Check the **Logs** tab to see progress.

The first deploy runs migrations automatically (via Procfile `release` command).

---

## Frontend Setup (Vercel)

### Step 1: Create Project on Vercel

1. Log into Vercel dashboard
2. Click **Add New...** → **Project**
3. **Import Git Repository** → select your GitHub repo
4. Configure:
   - **Project Name**: `climbing-app` (or your choice)
   - **Framework Preset**: **Vite**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - Leave "Install Command" and "Development Command" as default

### Step 2: Add Environment Variables to Vercel

In the Vercel project settings, go to **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `VITE_GOOGLE_CLIENT_ID` | Same as backend `GOOGLE_CLIENT_ID` |
| `VITE_API_URL` | `https://<your-render-domain>.onrender.com` (the backend URL) |

### Step 3: Deploy

Click **Deploy** — Vercel automatically builds and deploys.

Subsequent pushes to `master` trigger automatic deployments.

---

## Environment Variables Summary

### Backend (Render)

```
DEBUG=False
SECRET_KEY=<generate-new>
GOOGLE_CLIENT_ID=<from-google-cloud>
ALLOWED_HOSTS=<your-render-domain>.onrender.com
CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>.vercel.app
DATABASE_URL=<from-render-postgres>
```

### Frontend (Vercel)

```
VITE_GOOGLE_CLIENT_ID=<same-as-backend>
VITE_API_URL=https://<your-render-domain>.onrender.com
```

---

## Important Security Notes

1. **Do NOT commit `.env` files** to GitHub (they're in `.gitignore`)
2. **Rotate credentials** for production:
   - Generate new `SECRET_KEY` (never use the development one)
   - Create new Google OAuth app credentials
3. **First deployment will run migrations** — Render handles this via Procfile
4. **Database backups**: Render provides automatic backups on free tier

---

## Testing After Deployment

1. **Backend health check:**
   ```bash
   curl https://<your-render-domain>.onrender.com/api/gyms/
   ```
   Should return a JSON response (may be empty list if no gyms yet)

2. **Frontend:** Visit `https://<your-vercel-domain>.vercel.app`
   - Try regular login (username/password)
   - Try Google OAuth login
   - Try creating a gym (setter account)

3. **Check logs:**
   - Render: Dashboard → Logs tab
   - Vercel: Deployments tab → select deployment → Logs

---

## Troubleshooting

### Backend won't deploy
- Check Render logs for errors
- Ensure all required env vars are set
- Make sure `Procfile` and `runtime.txt` exist in `/backend/` root

### Frontend won't deploy
- Check Vercel logs
- Ensure `vercel.json` exists in `/frontend/` root
- Verify env vars are set (especially `VITE_API_URL`)

### CORS errors
- Frontend getting 403? Check `CORS_ALLOWED_ORIGINS` matches exact frontend URL
- Must include `https://` protocol

### Database errors
- PostgreSQL not connecting? Verify `DATABASE_URL` env var is correct
- Render shows migration error? Check Django logs in Render dashboard

### Google OAuth not working
- Confirm `GOOGLE_CLIENT_ID` is set correctly
- Check Google Cloud Console — authorized origins must match exactly
- Verify frontend is sending requests to the correct backend URL

---

## Redeploy/Updates

After making code changes:

1. **Backend**: Push to GitHub → Render auto-deploys
2. **Frontend**: Push to GitHub → Vercel auto-deploys
3. To run migrations manually (if needed):
   ```bash
   curl -X POST https://<your-render-domain>.onrender.com/api/
   ```
   Or check Render logs to see if migrations ran automatically

---

## Monitoring

- **Render**: Check "Metrics" tab for CPU/memory/API response times
- **Vercel**: Check "Analytics" for page performance
- Both services send you emails on deployment failures

---

## Free Tier Limits

- **Render**: 0.5 CPU, 512MB RAM (backend sleeps after 15 min inactivity)
- **Vercel**: 100GB bandwidth/month
- **PostgreSQL**: 10GB storage, 100MB/month download

Portfolio projects rarely hit these limits. If you need performance improvements:
- Render paid tier: $7/month (no sleep)
- Vercel pro: needed only for heavy traffic (unlikely for portfolio)
