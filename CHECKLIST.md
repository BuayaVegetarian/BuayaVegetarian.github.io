# Production Deployment Checklist

## ✅ Backend Deployment (Railway)
- [x] Code pushed to GitHub
- [x] Railway deployment successful
- [ ] **TODO**: Get Railway public URL

## ⏳ Frontend Configuration
- [ ] **TODO**: Copy Railway URL
- [ ] **TODO**: Update index.html with Railway URL
- [ ] **TODO**: Commit & push changes
- [ ] **TODO**: GitHub Pages auto-updates

## 🧪 Testing
- [ ] **TODO**: Open https://buayavegetarian.github.io
- [ ] **TODO**: Create a new batch (test API connection)
- [ ] **TODO**: Add pH log entry
- [ ] **TODO**: Confirm batch (archive it)
- [ ] **TODO**: Check History tab

## 📊 Monitoring
- [ ] **TODO**: Check Railway dashboard for any errors
- [ ] **TODO**: Check browser console (F12) for errors

---

## Quick Commands

### Get Railway URL
```bash
# In Railway CLI
railway status
```

### Or manually from dashboard:
1. Go to https://railway.app
2. Click your project "santan-demo"
3. Click "Deployments" tab
4. You'll see a deployment with a public URL
5. Copy that URL

### Update Frontend
```bash
# Edit this file and uncomment + set the URL:
nano index.html

# Then:
git add index.html
git commit -m "Configure Railway backend URL"
git push origin main
```

### Verify It Works
1. Open https://buayavegetarian.github.io in browser
2. Open DevTools (F12)
3. Go to Console tab
4. Type: `API_BASE` (should show your Railway URL)
5. Try creating a batch - should work!

---

## Troubleshooting

### "Failed to fetch" error
- Check if Railway URL is set in `index.html`
- Check if Railway deployment is running (green status in dashboard)
- Check browser console (F12) for actual error

### "Cannot GET /api/batches"
- Wrong Railway URL in `index.html`
- Railway hasn't started yet (wait 30 seconds)

### Database issues
- Railway auto-creates SQLite database
- No action needed from you
- Check Railway logs if unsure

---

## When You're Done

You'll have:
- ✅ Frontend: https://buayavegetarian.github.io
- ✅ Backend: https://your-railway-url.up.railway.app
- ✅ Database: Hosted on Railway (auto-managed)
- ✅ Auto-deployment: Every git push updates frontend immediately

**That's it! You have a production app!** 🚀
