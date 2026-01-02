# Railway Deployment Guide - Two Rooms and a Boom

This project is configured for deployment on Railway with separate client and server services.

## Project Structure

```
Two Rooms and a Boom/
├── client/              # React/Vite frontend
│   ├── railway.json    # Client Railway config
│   └── .railwayignore
├── server/              # Node.js WebSocket server
│   ├── railway.json    # Server Railway config
│   └── .railwayignore
├── shared/              # Shared TypeScript types
└── .railwayignore      # Root ignore file
```

## Deployment Steps

### 1. Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository: `GokuCity/Crclegames`

### 2. Deploy Server Service

1. In Railway project, click "+ New"
2. Select "GitHub Repo"
3. Choose the same repository
4. Click "Add Variables" and configure:

**Required Environment Variables:**
```bash
NODE_ENV=production
```

5. Go to Settings → Deploy:
   - **Root Directory**: `/server`
   - **Build Command**: (auto-detected from railway.json)
   - **Start Command**: (auto-detected from railway.json)

6. Go to Settings → Networking:
   - Click "Generate Domain" to create public URL
   - Note the domain (e.g., `your-server.up.railway.app`)

### 3. Deploy Client Service

1. In Railway project, click "+ New"
2. Select "GitHub Repo"
3. Choose the same repository again
4. Click "Add Variables" and configure:

**Required Environment Variables:**
```bash
VITE_WS_URL=wss://your-server.up.railway.app
VITE_API_URL=https://your-server.up.railway.app
```

Replace `your-server.up.railway.app` with your actual server domain from step 2.

5. Go to Settings → Deploy:
   - **Root Directory**: `/client`
   - **Build Command**: (auto-detected from railway.json)
   - **Start Command**: (auto-detected from railway.json)

6. Go to Settings → Networking:
   - Click "Generate Domain" to create public URL
   - Optionally add custom domain

### 4. Update Client Environment Variables

After server is deployed, update client environment variables:

1. Go to client service → Variables
2. Update with actual server URL:
```bash
VITE_WS_URL=wss://your-actual-server-domain.up.railway.app
VITE_API_URL=https://your-actual-server-domain.up.railway.app
```

3. Redeploy client service

## Environment Variables Reference

### Server Service
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port (auto-provided by Railway) | Auto | - |
| `NODE_ENV` | Environment mode | No | production |

### Client Service
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_WS_URL` | WebSocket server URL | Yes | wss://server.up.railway.app |
| `VITE_API_URL` | API server URL | Yes | https://server.up.railway.app |
| `PORT` | Client port (auto-provided by Railway) | Auto | - |

## Architecture

### Server
- **Technology**: Node.js with native HTTP and WebSocket (ws library)
- **Port**: Listens on `0.0.0.0:$PORT` (Railway-provided)
- **Health Check**: `GET /health` returns `{"status": "ok"}`
- **Endpoints**:
  - `POST /api/games` - Create new game
  - `POST /api/games/:code/join` - Join game
  - `GET /api/games/:id/players/:playerId` - Get game state
  - `WebSocket /ws` - Real-time game updates

### Client
- **Technology**: React + TypeScript + Vite
- **Build**: Static files served via `serve`
- **Environment**: Vite build injects `VITE_*` vars at build time

## Monitoring & Logs

### View Logs
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs --service server
railway logs --service client
```

### Health Checks
- Server: https://your-server-domain.up.railway.app/health
- Client: https://your-client-domain.up.railway.app (checks if site loads)

## Troubleshooting

### Server "Application Failed to Respond"
**Solution**: Server is configured to listen on `0.0.0.0:$PORT` as required by Railway.

Check server logs:
```bash
railway logs --service server
```

Look for: `✅ Server running on http://0.0.0.0:{PORT}`

### Client Can't Connect to Server
**Solution**: Check VITE environment variables:

1. Verify `VITE_WS_URL` and `VITE_API_URL` are set correctly
2. Ensure URLs use `wss://` for WebSocket and `https://` for API
3. Redeploy client after updating variables

### Build Failures

**Server Build Issues:**
```bash
# Test locally
cd server
npm install
npm run build
npm start
```

**Client Build Issues:**
```bash
# Test locally
cd client
npm install
npm run build
npx serve -s dist
```

## Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run both client and server
npm run dev

# Or run separately
npm run dev:server  # Server on port 3000
npm run dev:client  # Client on port 5173
```

## Production Deployment Checklist

- [ ] Server service deployed with correct root directory (`/server`)
- [ ] Server health check returns 200 at `/health`
- [ ] Server public domain generated
- [ ] Client service deployed with correct root directory (`/client`)
- [ ] Client `VITE_WS_URL` points to server wss:// URL
- [ ] Client `VITE_API_URL` points to server https:// URL
- [ ] Client public domain generated or custom domain added
- [ ] Both services show "Active" status in Railway
- [ ] Test: Can create game, join game, and play through WebSocket

## Cost Optimization

- Both services use Railway's private networking when in same project (no egress fees)
- Server is lightweight (Node.js HTTP + WebSocket)
- Client is static files (minimal resources)
- Estimated cost: ~$5-10/month on Hobby plan

## Scaling

To handle more traffic:

1. Go to server service → Settings → Deploy
2. Increase `numReplicas` in railway.json:
```json
{
  "deploy": {
    "numReplicas": 2
  }
}
```

Note: WebSocket connections are sticky, so multiple replicas work correctly.

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Repo: https://github.com/GokuCity/Crclegames

---

**Last Updated**: January 2026
**Railway Configuration**: Railpack builder with health checks
