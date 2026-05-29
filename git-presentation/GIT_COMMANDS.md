# Git Commands for NextOrder 

## 🔧 Initial Setup Commands

### Configure Git (First Time)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Initialize a Repository
```bash
git init
```

### Clone a Repository
```bash
git clone https://github.com/username/nextorder.git
```

---

## 📝 Basic Workflow Commands

### Check Status
```bash
git status
```

### Add Files to Staging
```bash
# Add specific file
git add server.js

# Add all files
git add .
```

### Commit Changes
```bash
git commit -m "Add kitchen management feature"
```

### View Commit History
```bash
git log --oneline
```

---

## 🌿 Branching Commands

### Create a New Branch
```bash
git branch feature/subscription
```

### Switch to a Branch
```bash
git checkout feature/subscription

# Or create and switch in one command
git checkout -b feature/order-reports
```

### List All Branches
```bash
git branch -a
```

### Merge a Branch
```bash
git checkout main
git merge feature/subscription
```

### Delete a Branch
```bash
git branch -d feature/subscription
```

---

## ☁️ Remote Repository Commands

### Add Remote Origin
```bash
git remote add origin https://github.com/username/nextorder.git
```

### Push to Remote
```bash
git push origin main
```

### Pull from Remote
```bash
git pull origin main
```

### View Remotes
```bash
git remote -v
```

---

## 🔍 Useful Commands for Screenshots

### View Detailed Log with Graph
```bash
git log --oneline --graph --all
```

### Show Changes in a File
```bash
git diff server.js
```

### Show Commit Details
```bash
git show HEAD
```

### View All Configurations
```bash
git config --list
```

---

## 🏗️ Git Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Git Workflow for NextOrder                   │
└─────────────────────────────────────────────────────────────────┘

  Working Directory      Staging Area         Local Repo         Remote Repo
  (Your Code Files)      (git add)            (git commit)       (GitHub/Render)
        │                     │                    │                   │
        │   git add .         │                    │                   │
        │────────────────────►│                    │                   │
        │                     │   git commit -m    │                   │
        │                     │───────────────────►│                   │
        │                     │                    │   git push        │
        │                     │                    │──────────────────►│
        │                     │                    │                   │
        │◄─────────────────────────────────────────────────────────────│
        │                          git pull                            │
        │                                                              │


┌──────────────────────────────────────────────────────────────────────┐
│                        Branching Strategy                             │
└──────────────────────────────────────────────────────────────────────┘

            main ──●──────●──────●──────●──────●──────● (Production)
                    \           /        \           /
     feature/auth ───●────●────●          \         /
                                           \       /
     feature/orders ────────────────────────●────●

```

---

## 📊 Sample Git Log Output (For Reference)

```
$ git log --oneline

a3f8c2d (HEAD -> main) Deploy to Render production
7b2e1f4 Add subscription and trial features
9c4d3a6 Implement date-wise order reports
2e8f5b1 Add kitchen dashboard with Socket.IO
f1a7c9e Create authentication system
8d3b2a7 Add order management API
4c6e9f2 Setup Express server and MongoDB
1a5d8c3 Initial commit - project setup
```

---

## 🚀 NextOrder Git History Summary

| Commit | Description |
|--------|-------------|
| Initial Setup | Project initialization with Express.js |
| Backend API | Order routes, Kitchen model, Auth system |
| Frontend | Dashboard, Login, Signup pages |
| Real-time | Socket.IO integration for live updates |
| Features | Subscription, Trial, Date-wise reports |
| Deployment | Render.com production deployment |
