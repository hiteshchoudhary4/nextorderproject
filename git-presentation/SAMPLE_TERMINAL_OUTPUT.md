# Sample Terminal Outputs for Presentation Screenshots

## 📋 git status Output

```bash
$ git status

On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   routes/orderRoutes.js
        modified:   public/dashboard.html

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
        modified:   models/Order.js

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        public/pricing.html
```

---

## 📜 git log Output

```bash
$ git log --oneline --graph -10

* a3f8c2d (HEAD -> main, origin/main) Deploy NextOrder to Render
* 7b2e1f4 Add 14-day trial and subscription features
* 9c4d3a6 Implement date-wise order reports with date picker
* 2e8f5b1 Add real-time updates with Socket.IO
* f1a7c9e Create kitchen dashboard with order management
* 8d3b2a7 Implement JWT authentication system
* 4c6e9f2 Add Kitchen and Order MongoDB models
* 1a5d8c3 Setup Express server with middleware
* 0b7f4e9 Create project structure and package.json
* 3d2a1c8 Initial commit
```

---

## 🌿 git branch Output

```bash
$ git branch -a

* main
  feature/subscription
  feature/date-reports
  remotes/origin/main
  remotes/origin/feature/subscription
```

---

## 📤 git push Output

```bash
$ git push origin main

Enumerating objects: 15, done.
Counting objects: 100% (15/15), done.
Delta compression using up to 8 threads
Compressing objects: 100% (10/10), done.
Writing objects: 100% (12/12), 3.45 KiB | 1.15 MiB/s, done.
Total 12 (delta 5), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (5/5), completed with 3 local objects.
To https://github.com/username/nextorder.git
   7b2e1f4..a3f8c2d  main -> main
```

---

## 📥 git pull Output

```bash
$ git pull origin main

remote: Enumerating objects: 8, done.
remote: Counting objects: 100% (8/8), done.
remote: Compressing objects: 100% (4/4), done.
remote: Total 6 (delta 3), reused 6 (delta 3), pack-reused 0
Unpacking objects: 100% (6/6), 1.20 KiB | 122.00 KiB/s, done.
From https://github.com/username/nextorder
 * branch            main       -> FETCH_HEAD
   f1a7c9e..a3f8c2d  main       -> origin/main
Updating f1a7c9e..a3f8c2d
Fast-forward
 routes/orderRoutes.js | 25 +++++++++++++++++++++++++
 public/dashboard.html | 15 +++++++++++++++
 2 files changed, 40 insertions(+)
```

---

## 🔀 git merge Output

```bash
$ git merge feature/subscription

Updating 9c4d3a6..7b2e1f4
Fast-forward
 models/Kitchen.js          | 12 ++++++++++++
 middleware/subscription.js | 45 +++++++++++++++++++++++++++++++++++++++++++++
 routes/kitchenRoutes.js    | 18 ++++++++++++++++++
 public/pricing.html        | 85 +++++++++++++++++++++++++++++++++++++++++++
 public/dashboard.html      | 35 +++++++++++++++++++++++++++++++
 5 files changed, 195 insertions(+)
 create mode 100644 middleware/subscription.js
 create mode 100644 public/pricing.html
```

---

## ⚙️ git remote -v Output

```bash
$ git remote -v

origin  https://github.com/username/nextorder.git (fetch)
origin  https://github.com/username/nextorder.git (push)
```

---

## 📊 git diff Output

```bash
$ git diff models/Order.js

diff --git a/models/Order.js b/models/Order.js
index 8d3b2a7..f1a7c9e 100644
--- a/models/Order.js
+++ b/models/Order.js
@@ -12,6 +12,10 @@ const orderSchema = new mongoose.Schema({
     type: String,
     required: true
   },
+  orderDate: {
+    type: Date,
+    default: Date.now
+  },
   status: {
     type: String,
     enum: ['pending', 'preparing', 'ready', 'delivered'],
```
