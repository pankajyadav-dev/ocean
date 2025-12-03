# OceanGuard Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- MongoDB Atlas account (for production database)
- Git repository with your code

## Environment Variables Setup

### Backend Environment Variables (Add in Vercel Dashboard)
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
OPENWEATHER_API_KEY=a502474af690979f367d3633e0e44061
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Frontend Environment Variables
These are automatically set during build:
```
VITE_API_URL=https://your-app.vercel.app/api
VITE_SOCKET_URL=https://your-app.vercel.app
```

## Deployment Steps

### 1. Push Code to GitHub
```bash
cd v:\coding\OceanGaurd
git add .
git commit -m "Prepared for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd v:\coding\OceanGaurd
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? oceanguard (or your choice)
# - Directory? ./ (root)
# - Override settings? No

# Deploy to production
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: Leave default
   - **Output Directory**: Leave default
4. Add all environment variables from above
5. Click "Deploy"

### 3. Post-Deployment Configuration

1. **Update Environment Variables**:
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add all backend environment variables listed above
   - Update `FRONTEND_URL` with your actual Vercel domain

2. **Update Frontend URLs**:
   - After deployment, note your Vercel URL (e.g., `oceanguard.vercel.app`)
   - Update `.env.production` in OceanFrontend:
     ```
     VITE_API_URL=https://oceanguard.vercel.app/api
     VITE_SOCKET_URL=https://oceanguard.vercel.app
     ```
   - Redeploy: `vercel --prod`

3. **MongoDB Atlas Whitelist**:
   - Go to MongoDB Atlas
   - Network Access → Add IP Address
   - Add: `0.0.0.0/0` (allow from anywhere) for Vercel functions

### 4. Verify Deployment

Test these endpoints:
- Homepage: `https://your-app.vercel.app/`
- API Health: `https://your-app.vercel.app/api/health`
- Map Page: `https://your-app.vercel.app/map`

## Important Notes

### Socket.io Limitations on Vercel
⚠️ **Vercel serverless functions don't support WebSocket connections persistently**. Socket.io will fall back to HTTP polling, which works but is less efficient.

**Solutions**:
1. Use Vercel for frontend only, deploy backend to:
   - **Railway** (recommended for Node.js + Socket.io)
   - **Render**
   - **Heroku**
   - **DigitalOcean App Platform**

2. Or use Vercel with Pusher/Ably for real-time features

### File Uploads
- Vercel's serverless functions have limited file system access
- Uploaded hazard images should be stored in:
  - **Cloudinary** (recommended)
  - **AWS S3**
  - **Vercel Blob Storage**

## Recommended Production Architecture

```
Frontend (Vercel)
    ↓
Backend API (Railway/Render)
    ↓
MongoDB Atlas (Database)
    ↓
Cloudinary (Image Storage)
```

## Alternative: Deploy Backend Separately

### Backend to Railway:
```bash
cd oceanbackend
# Create railway.json
echo '{"build": {"builder": "NIXPACKS"}, "deploy": {"startCommand": "npm start"}}' > railway.json

# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Update Frontend to use Railway backend:
```env
VITE_API_URL=https://your-app.up.railway.app/api
VITE_SOCKET_URL=https://your-app.up.railway.app
```

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Verify TypeScript compilation succeeds locally

### API Routes 404
- Verify `vercel.json` routes configuration
- Check API function exports correctly

### Database Connection Fails
- Verify MongoDB URI is correct
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`

### Environment Variables Not Working
- Ensure variables are set in Vercel dashboard
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)

## Monitoring

- **Logs**: Vercel Dashboard → Your Project → Deployments → View Function Logs
- **Analytics**: Vercel Dashboard → Analytics tab
- **Errors**: Set up error tracking with Sentry

## Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update CORS settings in backend to allow your domain
