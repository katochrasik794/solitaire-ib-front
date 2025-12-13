# 🚀 Deploy to Vercel - Quick Guide

## ✅ Backend Verified
Your Render backend is working: `https://zup-ib-back.onrender.com`

## 📝 Steps to Deploy

### 1. Add Environment Variable to Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add this variable:
```
Name: VITE_API_BASE_URL
Value: https://zup-ib-back.onrender.com/api
```

### 2. Deploy

**Option A - Git Push (Recommended):**
```bash
cd /Users/macmini/Desktop/zuperior-Final/ib-portal/client
git add .
git commit -m "fix: configure production API URL"
git push
```

**Option B - Vercel CLI:**
```bash
cd /Users/macmini/Desktop/zuperior-Final/ib-portal/client
vercel --prod
```

**Option C - Vercel Dashboard:**
- Go to your Vercel project
- Click "Redeploy" button
- Select "Use existing Build Cache: No"

### 3. Verify Deployment

After deployment, test your site:

1. **Open your Vercel URL** (e.g., `https://your-app.vercel.app`)
2. **Open Browser Console** (F12)
3. **Check Network Tab** - API calls should go to `https://zup-ib-back.onrender.com/api/*`
4. **No more HTML errors!** ✅

### 4. Test API Endpoints

Open browser console on your deployed site and run:
```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ API Working:', d))
  .catch(e => console.error('❌ API Error:', e))
```

Should return:
```json
{
  "status": "OK",
  "message": "IB Portal Server is running"
}
```

## 🔧 Files Updated

✅ `client/.env.production` - Backend URL configured
✅ `client/vercel.json` - API proxy configured
✅ `client/src/utils/api.js` - Production fallback added

## 🎉 Done!

Your frontend will now correctly call your Render backend and get JSON responses!

## 🐛 Troubleshooting

**Still getting errors?**
1. Clear Vercel build cache and redeploy
2. Check Environment Variable is set in Vercel
3. Make sure you're testing the latest deployment
4. Check browser console for actual error messages

**CORS errors?**
Your backend already has CORS configured. If you see CORS errors, add your Vercel URL to the backend's allowed origins in `server/server.js`.
