# Deploying Two Rooms and a Boom to Vercel

## Prerequisites

1. A GitHub account
2. A Vercel account (sign up at https://vercel.com)
3. Code pushed to GitHub repository

## Deployment Steps

### Step 1: Push Code to GitHub

Make sure all your latest changes are committed and pushed:

```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin master
```

### Step 2: Import Project to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `GokuCity/Crclegames`
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build:client`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

### Step 3: Environment Variables (if needed)

If you have any environment variables, add them in the Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add any required variables

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Vercel will provide you with a URL (e.g., `your-project.vercel.app`)

## Important Notes

### WebSocket Limitation

**Vercel does not support WebSocket connections in serverless functions.**

Your current architecture uses WebSockets for real-time communication. This means:

- ❌ The WebSocket server **will not work** on Vercel
- ❌ Game state synchronization **will not work**
- ❌ Real-time updates **will not work**

### Recommended Solutions

#### Option 1: Deploy Backend Separately (Recommended)

Deploy the backend on a platform that supports WebSockets:

**Backend Options:**
- **Render** (https://render.com) - Free tier available
- **Railway** (https://railway.app) - Free tier available
- **Heroku** - Paid
- **DigitalOcean App Platform** - Paid

**Frontend on Vercel:**
- Deploy the client to Vercel as planned

**Steps:**
1. Deploy backend to Render/Railway
2. Update client WebSocket URL to point to backend deployment
3. Deploy client to Vercel

#### Option 2: Deploy Everything Together

Use a platform that supports both frontend and backend:

- **Render** - Can host both in one project
- **Railway** - Can host both in one project
- **DigitalOcean** - Can host both in one droplet

#### Option 3: Keep Testing Locally

For now, continue local development until you're ready for full deployment.

## Testing the Deployment

1. Visit your Vercel URL
2. Try to create/join a game
3. If WebSocket errors appear, you'll need to deploy the backend separately

## Next Steps

1. Choose a deployment strategy (Option 1 recommended)
2. Deploy backend to a WebSocket-compatible platform
3. Update client configuration with backend URL
4. Test full application

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
