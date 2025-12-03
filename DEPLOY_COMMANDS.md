# Unified Deployment Commands (Backend serves Frontend)

## Architecture
- **Single Server**: Backend serves the built frontend
- **Deployment**: Railway (recommended) or Render
- **Real-time**: Full Socket.io support ✅
- **Cost**: Free tier available

## Quick Deploy to Railway

### 1. Prepare Your Code
```bash
cd v:\coding\OceanGaurd
git add .
git commit -m "Unified deployment: backend serves frontend"
git push origin main
```

### 2. Deploy to Railway

#### Option A: Using Railway Dashboard (Easiest)
1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your `ocean` repository
4. Railway will auto-detect and deploy
5. Add environment variables (see below)

#### Option B: Using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize and deploy from root directory
cd v:\coding\OceanGaurd
railway init
railway up
```

### 3. Add Environment Variables in Railway Dashboard

Go to your Railway project → Variables tab:

```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key_here
EMAIL_USER=kartikevergreen4@gmail.com
EMAIL_PASSWORD=syiludwszgghkkwt
OPENWEATHER_API_KEY=a502474af690979f367d3633e0e44061
NODE_ENV=production
PORT=3000
```

### 4. Get Your Railway URL

After deployment, Railway will give you a URL like:
`https://oceanguard-production.up.railway.app`

That's it! Your app is deployed:
- Frontend: `https://your-app.up.railway.app/`
- API: `https://your-app.up.railway.app/api/health`
- Socket.io: Auto-connected ✅

## Alternative: Deploy to Render

### 1. Create New Web Service
1. Go to https://render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: oceanguard
   - **Root Directory**: `oceanbackend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2. Add Environment Variables
Same as Railway (see above)

### 3. Deploy
Click "Create Web Service"

## MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com/
2. Create a free cluster
3. Database Access → Add User
4. Network Access → Add IP: `0.0.0.0/0` (allow from anywhere)
5. Connect → Get connection string
6. Add to Railway/Render environment variables

## Testing Your Deployment

```bash
# Check API
curl https://your-app.up.railway.app/api/health

# Should return: {"message":"OceanGuard API is running","status":"healthy"}
```

Visit in browser:
- Home: `https://your-app.up.railway.app/`
- Map: `https://your-app.up.railway.app/map`
- News: `https://your-app.up.railway.app/news`

## Local Testing of Production Build

```bash
# Build everything
cd v:\coding\OceanGaurd\oceanbackend
npm run build

# Start production server
npm start

# Open browser to http://localhost:3000
```

## Troubleshooting

### Build Fails
```bash
# Check build locally first
cd v:\coding\OceanGaurd\oceanbackend
npm run build

# If frontend build fails
cd ../OceanFrontend
npm install
npm run build
```

### Database Connection Fails
- Verify MongoDB URI in environment variables
- Check MongoDB Atlas allows connections from `0.0.0.0/0`
- Check database user has read/write permissions

### Frontend Not Loading
- Check build command ran successfully in logs
- Verify `NODE_ENV=production` is set
- Check `OceanFrontend/dist` folder exists after build

### Socket.io Not Connecting
- Check browser console for errors
- Verify server logs show Socket.io initialized
- Railway automatically handles WebSocket connections ✅

## Updating Your Deployment

```bash
# Make changes, commit, and push
git add .
git commit -m "Your update message"
git push origin main

# Railway auto-deploys on push ✅
```

## Cost Estimate

**Free Tier (Railway)**:
- ✅ $5 free credit/month
- ✅ Enough for small-medium traffic
- ✅ Sleeps after inactivity
- ✅ Full Socket.io support

**MongoDB Atlas**:
- ✅ 512MB free forever
- ✅ Perfect for development/testing

## Quick Links

- Railway Dashboard: https://railway.app/dashboard
- Render Dashboard: https://dashboard.render.com/
- MongoDB Atlas: https://cloud.mongodb.com/

## Production Checklist

- [x] Environment variables set
- [x] MongoDB connection string updated
- [x] Frontend builds successfully
- [x] Backend serves frontend in production
- [x] Socket.io configured correctly
- [x] API routes working
- [x] File uploads directory created
- [ ] Custom domain (optional)
- [ ] SSL certificate (auto on Railway/Render)

