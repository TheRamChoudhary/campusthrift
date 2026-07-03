# CampusThrift Docker Deployment Cheat Sheet

This guide contains the most common commands and workflows for managing and deploying the CampusThrift application on AWS EC2.

---

## 🚀 First-Time Deployment
```bash
# Clone the repository
git clone https://github.com/Ram-Choudhary-24/campusthrift.git
cd campusthrift

# Build and start containers
sudo docker compose up --build -d
```

---

## 🔄 After Updating Code on GitHub (Most Common Workflow)
```bash
cd ~/campusthrift
git pull
sudo docker compose down
sudo docker compose up --build -d
sudo docker ps
```

If Docker caches old layers and doesn't load changes:
```bash
cd ~/campusthrift
git pull
sudo docker compose down
sudo docker compose build --no-cache
sudo docker compose up -d
```

---

## 📊 Check Status & Logs

### Check Running Containers
```bash
sudo docker ps
```

### View Logs
* **Backend Logs:**
  ```bash
  sudo docker logs campusthrift-server --tail=100
  ```
* **Frontend Logs:**
  ```bash
  sudo docker logs campusthrift-client --tail=100
  ```
* **MongoDB Logs:**
  ```bash
  sudo docker logs campusthrift-db --tail=100
  ```
* **Live Combined Logs (Interactive):**
  ```bash
  sudo docker compose logs -f
  ```

---

## ⚙️ Container Operations

### Restart Everything
```bash
sudo docker compose restart
```

### Stop Everything
```bash
sudo docker compose down
```

### Start Back Up
```bash
sudo docker compose up -d
```

### Rebuild and Run
```bash
sudo docker compose up --build -d
```

### Clean Up Everything (Removes Containers, Images, Networks & Volumes)
> [!CAUTION]
> This will wipe your local database volume and all data. Use with care.
```bash
sudo docker compose down --volumes --rmi all
```

---

## 📂 Git & System Diagnostics

### Pull Latest Code
```bash
git pull
```

### Check Git Status
```bash
git status
```

### Check Current Branch
```bash
git branch
```

### Check Environment Variables
```bash
cat ~/campusthrift/server/.env
```

### Check if Backend is Accessible Locally
```bash
curl http://localhost:5000
```

---

## 🐳 Interactive Shell Access

Enter a running container's shell environment:
* **Backend:**
  ```bash
  sudo docker exec -it campusthrift-server sh
  ```
* **Frontend:**
  ```bash
  sudo docker exec -it campusthrift-client sh
  ```
* **MongoDB:**
  ```bash
  sudo docker exec -it campusthrift-db bash
  ```

*To leave the container shell, type:*
```bash
exit
```

---

## 📈 System Maintenance & Resource Monitoring

### Remove Unused Docker Cache/Data (Free up disk space)
```bash
sudo docker system prune -a
```

### Check CPU/RAM Usage of Running Containers
```bash
sudo docker stats
```
