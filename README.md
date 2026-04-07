# Smart Ration Shop System

Full-stack ration shop web app with:
- User, Seller, Admin, and Delivery portals
- MongoDB data storage
- Monthly stock and order workflow
- Multi-language UI (English / Hindi / Telugu)

## 1) Run locally

```powershell
npm install
npm start
```

Open: `http://localhost:3000`

## 2) Push this project to GitHub

Run these commands inside this folder:

```powershell
git init
git add .
git commit -m "Initial ration shop system"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```

## 3) Create MongoDB Atlas database (for live deploy)

1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create DB user (username/password).
3. In Network Access, allow your deploy provider IP (or temporarily `0.0.0.0/0`).
4. Copy connection string and set DB name as `rationDB`.

Example:

```text
mongodb+srv://<username>:<password>@<cluster-url>/rationDB?retryWrites=true&w=majority
```

## 4) Seed initial data into Atlas

From your system terminal:

```powershell
mongosh "mongodb+srv://<username>:<password>@<cluster-url>/rationDB?retryWrites=true&w=majority" mongodb/seed-rationdb.mongosh.js
```

## 5) Deploy to Render (live public URL)

1. Create account: [Render](https://render.com/)
2. Click **New +** -> **Web Service**
3. Connect your GitHub repo and select this project
4. Use these settings:
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add Environment Variable:
   - `MONGODB_URI` = your Atlas connection string
6. Deploy

Render will give a live URL like:

```text
https://your-app-name.onrender.com
```

Share this URL with users.

## 6) Important notes

- Keep `MONGODB_URI` secret (never commit real credentials).
- If you update code later:

```powershell
git add .
git commit -m "update"
git push
```

Render auto-redeploys after each push to `main`.
