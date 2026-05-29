# Docker Commands for NextOrder 

## 🐳 Basic Docker Commands

### Build the Docker Image
```bash
docker build -t nextorder-app .
```

### Run a Container
```bash
docker run -d -p 3000:3000 --name nextorder nextorder-app
```

### List Running Containers
```bash
docker ps
```

### View Container Logs
```bash
docker logs nextorder
```

### Stop a Container
```bash
docker stop nextorder
```

### Remove a Container
```bash
docker rm nextorder
```

---

## 🎭 Docker Compose Commands

### Start All Services
```bash
docker-compose up -d
```

### View Running Services
```bash
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f
```

### Stop All Services
```bash
docker-compose down
```

### Rebuild and Start
```bash
docker-compose up -d --build
```

---

## 📊 Useful Commands for Screenshots

### List All Images
```bash
docker images
```

### Inspect a Container
```bash
docker inspect nextorder-app
```

### View Resource Usage
```bash
docker stats
```

### Check Docker Version
```bash
docker --version
docker-compose --version
```

---

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│  ┌─────────────────┐      ┌─────────────────────────┐  │
│  │  nextorder-app  │      │    MongoDB Container    │  │
│  │     (Node.js)   │ ───► │      (Database)         │  │
│  │    Port: 3000   │      │      Port: 27017        │  │
│  └─────────────────┘      └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   Browser     │
            │ localhost:3000│
            └───────────────┘
```
