# UNO Mercy — Complete Setup Guide

## STEP 1 — Install Node.js
1. Go to https://nodejs.org
2. Click the green LTS button and download
3. Run installer, click Next through everything
4. Open Command Prompt (Windows: Win+R → type cmd → Enter)
5. Type: node --version
   You should see: v20.x.x ✅

## STEP 2 — Install VS Code
1. Go to https://code.visualstudio.com
2. Download and install it
3. This is your code editor

## STEP 3 — Create GitHub account
1. Go to https://github.com
2. Sign up free

## STEP 4 — Set up the project
Open Command Prompt and run these one by one:

  cd Desktop
  mkdir uno-mercy
  cd uno-mercy

Now open VS Code → File → Open Folder → select uno-mercy on your Desktop.
Create these two folders inside: server and client
Paste all the files as described in the guide.

## STEP 5 — Install server dependencies
In Command Prompt:

  cd Desktop\uno-mercy\server
  npm install

## STEP 6 — Install client dependencies
  cd Desktop\uno-mercy\client
  npm install

## STEP 7 — Test locally
Open TWO Command Prompt windows.

Window 1 (server):
  cd Desktop\uno-mercy\server
  node index.js
  You should see: ✅ UNO Mercy server running on port 3001

Window 2 (client):
  cd Desktop\uno-mercy\client
  npm run dev
  Open http://localhost:5173 in your browser ✅

## STEP 8 — Push to GitHub
In Command Prompt from Desktop\uno-mercy:

  git init
  git add .
  git commit -m "UNO Mercy initial commit"

Then:
1. Go to github.com
2. Click New Repository
3. Name it: uno-mercy
4. Keep it Public
5. Click Create Repository
6. Copy the two lines that start with "git remote add origin..."
7. Paste them in Command Prompt and press Enter

## STEP 9 — Deploy server to Render (FREE)
1. Go to https://render.com
2. Sign up with your GitHub account
3. Click New → Web Service
4. Click Connect next to your uno-mercy repo
5. Fill in these settings:
   - Name: uno-mercy-server
   - Root Directory: server
   - Runtime: Node
   - Build Command: npm install
   - Start Command: node index.js
   - Plan: Free ✅
6. Scroll down to Environment Variables, click Add:
   - Key: ADMIN_PASSWORD
   - Value: (choose your own secret password, e.g. pizza2024)
   - Key: CLIENT_URL
   - Value: * (for now, update after Vercel deploy)
7. Click Create Web Service
8. Wait 3-5 minutes for deploy
9. Copy your URL: https://uno-mercy-server-xxxx.onrender.com
   SAVE THIS URL — you need it next

## STEP 10 — Update client with your server URL
Open file: client/.env.production
Change this line:
  VITE_SERVER_URL=https://YOUR-APP-NAME.onrender.com
To your actual Render URL from Step 9.

Then commit and push:
  git add .
  git commit -m "add server url"
  git push

## STEP 11 — Deploy frontend to Vercel (FREE)
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click Add New → Project
4. Import your uno-mercy repository
5. Set Root Directory to: client
6. Click Deploy
7. Wait ~2 minutes
8. You get a URL like: https://uno-mercy-xxxx.vercel.app
   THIS IS YOUR GAME LINK — share with friends ✅

## STEP 12 — Update Render with your Vercel URL
Go back to Render → your service → Environment:
- Change CLIENT_URL value to your Vercel URL
- Click Save Changes → Render will redeploy (~2 min)

## HOW TO PLAY
1. You open your Vercel link
2. Click "Host Game"
3. Enter your name + your ADMIN_PASSWORD from Step 9
4. A 4-letter room code appears (e.g. WOLF)
5. Share that code with friends
6. Friends open the same Vercel link, click "Join Game", enter the code
7. Once everyone is in, only YOU see the "Start Game" button
8. Click it and the game begins!

## ADMIN PASSWORD
The ADMIN_PASSWORD is set by you in Render's environment variables.
Only the person who knows it can create/host rooms.
Your friends just join with the room code — they don't need the password.

## IF SERVER SLEEPS (Render free tier)
Render's free tier sleeps after 15 minutes of inactivity.
When someone first opens the game, it takes ~30 seconds to wake up.
After that it's fast. This is normal on the free tier.

## UPDATING THE GAME
If you change any code:
  git add .
  git commit -m "update"
  git push
Render and Vercel will automatically redeploy. ✅
