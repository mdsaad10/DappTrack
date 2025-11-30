# DappTrack - Deployment Guide

## 🚀 Complete Deployment Instructions

This guide will help you deploy the complete DappTrack application (Frontend + Backend) to production.

---

## 📦 What's Included

- **Frontend**: React + TypeScript + Vite SPA
- **Backend**: Express.js API with IPFS integration  
- **Smart Contract**: Already deployed on Aptos Testnet
- **Storage**: Pinata IPFS for document proofs

---

## 1️⃣ Frontend Deployment (Vercel - Recommended)

### Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to project directory
cd c:\Users\user\Desktop\Hackathons\Build-on-Aptos\DappTrack\dapptrack

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository or upload the project
4. Set environment variables:
   - `VITE_APP_NETWORK` = `testnet`
   - `VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS` = `0x80ab1ccee8fbcfdbd54e0efe1643a41617b4cf7ca7659be6dc0169d2dddf275b`
   - `VITE_APTOS_API_KEY` = `AG-7TD1PGCZPAWNX2WLXKMPRLGVBLA2RDEUZ`
5. Build Command: `npx vite build`
6. Output Directory: `dist`
7. Click "Deploy"

**Result**: Your frontend will be live at `https://your-project.vercel.app`

---

## 2️⃣ Frontend Deployment (Netlify - Alternative)

### Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to project directory
cd c:\Users\user\Desktop\Hackathons\Build-on-Aptos\DappTrack\dapptrack

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod --dir=dist
```

### Using Netlify Dashboard

1. Go to [netlify.com](https://www.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `dist` folder
4. Set environment variables in Site Settings:
   - `VITE_APP_NETWORK` = `testnet`
   - `VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS` = `0x80ab1ccee8fbcfdbd54e0efe1643a41617b4cf7ca7659be6dc0169d2dddf275b`
   - `VITE_APTOS_API_KEY` = `AG-7TD1PGCZPAWNX2WLXKMPRLGVBLA2RDEUZ`

**Result**: Your frontend will be live at `https://your-project.netlify.app`

---

## 3️⃣ Backend Deployment (Railway - Recommended)

### Option A: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to backend directory
cd backend

# Initialize Railway project
railway init

# Deploy
railway up
```

### Option B: Using Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set Root Directory: `backend`
5. Add environment variables:
   ```
   PORT=3001
   VITE_APP_NETWORK=testnet
   VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS=0x80ab1ccee8fbcfdbd54e0efe1643a41617b4cf7ca7659be6dc0169d2dddf275b
   PINATA_API_KEY=aba4267645aefbf8ecd1
   PINATA_SECRET_KEY=1a8b587d6c2ab059270560bd9c8342ed39bfff5e81e363dfde31b610ceed8149
   PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlYjMxYWNiMi03MDJjLTRkMDYtYmE0NS1hY2I3NzIwMmFiZWIiLCJlbWFpbCI6Im1vaGFtbWVkc2FhZDA0NjJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImFiYTQyNjc2NDVhZWZiZjhlY2QxIiwic2NvcGVkS2V5U2VjcmV0IjoiMWE4YjU4N2Q2YzJhYjA1OTI3MDU2MGJkOWM4MzQyZWQzOWJmZmY1ZTgxZTM2M2RmZGUzMWI2MTBjZWVkODE0OSIsImV4cCI6MTc5NTk3MjgzMX0.VS3co0su9JPjSlSPfFqqMbBHzi7Ljd9PCSPBjaFMTk0
   ```
6. Start Command: `npm start`
7. Deploy

**Result**: Your backend will be live at `https://your-project.railway.app`

---

## 4️⃣ Backend Deployment (Render - Alternative)

1. Go to [render.com](https://render.com)
2. Click "New+" → "Web Service"
3. Connect your repository
4. Configure:
   - Name: `dapptrack-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Add all environment variables from above
5. Click "Create Web Service"

**Result**: Your backend will be live at `https://dapptrack-backend.onrender.com`

---

## 5️⃣ Update Frontend with Backend URL

After deploying the backend, update your frontend to point to the production backend:

### In your frontend code (or as environment variable):

```typescript
// frontend/utils/aptosClient.ts or constants.ts
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'https://your-backend.railway.app';
```

### Add to Vercel/Netlify environment variables:
```
VITE_BACKEND_URL=https://your-backend.railway.app
```

Then redeploy the frontend.

---

## 6️⃣ Quick Deployment (All-in-One)

For fastest deployment, use this PowerShell script:

```powershell
# Build frontend
cd c:\Users\user\Desktop\Hackathons\Build-on-Aptos\DappTrack\dapptrack
npx vite build

# Deploy frontend to Vercel
vercel --prod

# Deploy backend to Railway
cd backend
railway up

# Done! Your app is live!
```

---

## 🌐 Current Deployment Status

### Smart Contract
- ✅ **Deployed** on Aptos Testnet
- Address: `0x80ab1ccee8fbcfdbd54e0efe1643a41617b4cf7ca7659be6dc0169d2dddf275b`
- Network: Testnet

### Frontend
- ✅ **Built** successfully
- Location: `dist/` folder
- Size: 5.6 MB (minified)
- Ready for deployment to Vercel or Netlify

### Backend
- ✅ **Ready** for deployment
- Location: `backend/` folder
- Dependencies: Installed
- IPFS: Configured with Pinata

---

## 📝 Environment Variables Checklist

### Frontend (.env)
```env
VITE_APP_NETWORK=testnet
VITE_APTOS_API_KEY=AG-7TD1PGCZPAWNX2WLXKMPRLGVBLA2RDEUZ
VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS=0x80ab1ccee8fbcfdbd54e0efe1643a41617b4cf7ca7659be6dc0169d2dddf275b
VITE_BACKEND_URL=https://your-backend-url.com
```

### Backend (.env)
```env
PORT=3001
VITE_APP_NETWORK=testnet
VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS=0x80ab1ccee8fbcfdbd54e0efe1643a41617b4cf7ca7659be6dc0169d2dddf275b
PINATA_API_KEY=aba4267645aefbf8ecd1
PINATA_SECRET_KEY=1a8b587d6c2ab059270560bd9c8342ed39bfff5e81e363dfde31b610ceed8149
PINATA_JWT=<your-jwt-token>
```

---

## 🔒 Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env` files to Git
- Keep `VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY` secret (do not expose in frontend)
- Use environment variables for all sensitive data
- Add `.env` to `.gitignore` (already done)

---

## ✅ Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and responding to `/api/health`
- [ ] Frontend can connect to backend API
- [ ] Wallet connection works (Petra, Pontem, Martian)
- [ ] Donations can be made successfully
- [ ] Expense verification works
- [ ] IPFS uploads functional
- [ ] All pages load correctly
- [ ] Mobile responsive design works

---

## 🆘 Troubleshooting

### Frontend not loading
- Check environment variables are set correctly
- Verify build succeeded: `npm run build`
- Check browser console for errors

### Backend API errors
- Verify backend is running: `curl https://your-backend/api/health`
- Check environment variables in hosting platform
- Review backend logs in Railway/Render dashboard

### Wallet connection issues
- Ensure wallet is set to Aptos Testnet
- Check console for wallet adapter errors
- Verify contract address is correct

### Transaction failures
- Confirm user has APT in testnet wallet
- Check contract address matches deployed contract
- Verify function arguments are correct

---

## 📞 Support Resources

- **Aptos Explorer**: https://explorer.aptoslabs.com/?network=testnet
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Pinata Docs**: https://docs.pinata.cloud

---

## 🎉 Congratulations!

Your DappTrack application is now live and accessible worldwide!

**Frontend**: Track donations, make donations, verify expenses  
**Backend**: IPFS uploads, event queries, organization management  
**Blockchain**: Immutable transparency on Aptos Testnet

**Built with ❤️ for transparent governance**
