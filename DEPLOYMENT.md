# Deployment Guide - Santan Demo

## Status
- ✅ **Code**: Pushed to GitHub (main branch)
- ⏳ **Frontend**: GitHub Pages (auto-deploy)
- ⏳ **Backend**: Ready to deploy to Railway

## Step 1: Deploy Backend to Railway (5 minutes)

### 1.1 Sign Up
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub (or email)
4. Allow Railway to access your GitHub repos

### 1.2 Deploy Project
1. Click "Deploy from GitHub repo"
2. Select: `BuayaVegetarian/santan-demo`
3. Click "Deploy"
4. Railway will auto-detect Node.js app and deploy
5. Wait 2-3 minutes for deployment to complete

### 1.3 Get Backend URL
1. Once deployed, Railway shows a generated URL like:
   ```
   https://santan-demo-production.up.railway.app
   ```
2. **Copy this URL** - you'll need it next

### 1.4 Set Environment Variables (if needed)
In Railway Dashboard:
- Click your deployment
- Go to "Variables" tab
- No changes needed (Node defaults are fine)

---

## Step 2: Update Frontend with Backend URL

### 2.1 Edit index.html
1. In your local repo, open `index.html`
2. Find this section (around line 41):
   ```html
   <script>
     // For GitHub Pages deployment with external backend:
     // window.API_BASE_URL = 'https://your-backend-server.com';
   </script>
   ```
3. Replace with your Railway URL:
   ```html
   <script>
     window.API_BASE_URL = 'https://santan-demo-production.up.railway.app';
   </script>
   ```

### 2.2 Commit & Push
```bash
git add index.html
git commit -m "Update backend URL for production"
git push origin main
```

GitHub Pages will auto-update within seconds.

---

## Step 3: Test Production

1. Go to: https://buayavegetarian.github.io
2. Try creating a batch:
   - Click "Collection" tab
   - Enter STG number (e.g., "01")
   - Click "Create Batch"
3. Check browser console (F12) for any errors

---

## Troubleshooting

### "Error creating batch: Failed to fetch"
- Check Railway deployment is running (green status)
- Verify `window.API_BASE_URL` is set in browser console
- Check CORS (should be enabled in backend)

### "Cannot GET /api/batches"
- Railway URL is wrong
- Backend not started
- Check Railway logs for errors

### GitHub Pages not updating
- Wait 30 seconds
- Hard refresh browser (Ctrl+Shift+R)
- Check GitHub Actions tab - deployment should be "passing"

---

## Auto-Deployment Setup

GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
- ✅ Auto-deploy frontend to GitHub Pages on every `git push`
- ⚠️ Backend deployment via Railway requires manual setup (Railway auto-syncs from GitHub)

To enable automatic Railway deployments:
1. In Railway Dashboard → Settings → GitHub Integration
2. Connect to your repo
3. Set auto-deploy on push (if not already enabled)

---

## Production Architecture

```
User Browser
    ↓
GitHub Pages Frontend (Static)
    ↓
Railway Backend API (Node.js/Express)
    ↓
SQLite Database
```

- Frontend: `https://buayavegetarian.github.io`
- Backend: `https://santan-demo-production.up.railway.app`
- Database: Hosted on Railway (auto-created)

---

## Tips

- Railway includes 5GB/month free tier
- Database persists across restarts
- Logs available in Railway dashboard
- Can scale up anytime if needed
- Custom domain support (paid feature)

---

## Next Steps

1. Deploy backend to Railway (follow Step 1 above)
2. Update `index.html` with Railway URL (Step 2)
3. Test at https://buayavegetarian.github.io (Step 3)
4. Monitor Railway dashboard for any issues

**Questions?** Check Railway docs: https://docs.railway.app

