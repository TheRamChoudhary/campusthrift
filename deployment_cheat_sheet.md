# CampusThrift AWS EC2 Deployment Cheat Sheet

## Server Details

* **OS:** Ubuntu 26.04
* **Project Folder:** `~/campusthrift`
* **SSH User:** `ubuntu`
* **Public IP:** `56.228.36.223`
* **SSH Key:** `campusthrift.pem`

---

# 1. Connect to the EC2 Server (From Windows)

Open Command Prompt or PowerShell:

```bash
cd C:\Users\india\Downloads

ssh -i "campusthrift.pem" ubuntu@56.228.36.223
```

If the IP changes, replace `56.228.36.223` with the new EC2 Public IPv4 address.

---

# 2. Go to Your Project

```bash
cd ~/campusthrift
```

Check you're in the correct folder:

```bash
pwd
```

Expected:

```text
/home/ubuntu/campusthrift
```

---

# 3. Check Git Status

```bash
git status
```

---

# 4. Pull Latest Code from GitHub

```bash
git pull
```

or

```bash
git pull origin main
```

---

# 5. Deploy New Changes

```bash
cd ~/campusthrift

git pull

sudo docker compose down

sudo docker compose up --build -d
```

---

# 6. Force a Fresh Build (No Docker Cache)

Use this when Docker is using old files.

```bash
cd ~/campusthrift

git pull

sudo docker compose down

sudo docker compose build --no-cache

sudo docker compose up -d
```

---

# 7. Check Running Containers

```bash
sudo docker ps
```

Expected containers:

* campusthrift-client
* campusthrift-server
* campusthrift-db

---

# 8. View Logs

Backend:

```bash
sudo docker logs campusthrift-server --tail=100
```

Frontend:

```bash
sudo docker logs campusthrift-client --tail=100
```

MongoDB:

```bash
sudo docker logs campusthrift-db --tail=100
```

Live logs:

```bash
sudo docker compose logs -f
```

---

# 9. Restart Containers

```bash
sudo docker compose restart
```

---

# 10. Stop Containers

```bash
sudo docker compose down
```

---

# 11. Start Containers

```bash
sudo docker compose up -d
```

---

# 12. Check Environment Variables

```bash
cat ~/campusthrift/server/.env
```

---

# 13. Edit Environment Variables

```bash
nano ~/campusthrift/server/.env
```

Save:

* Ctrl + O
* Enter

Exit:

* Ctrl + X

---

# 14. Edit Docker Compose

```bash
nano ~/campusthrift/docker-compose.yml
```

---

# 15. Edit Nginx Configuration

```bash
nano ~/campusthrift/client/nginx.conf
```

---

# 16. Check Backend Response

```bash
curl http://localhost:5000
```

---

# 17. Enter a Docker Container

Backend:

```bash
sudo docker exec -it campusthrift-server sh
```

Frontend:

```bash
sudo docker exec -it campusthrift-client sh
```

MongoDB:

```bash
sudo docker exec -it campusthrift-db bash
```

Exit:

```bash
exit
```

---

# 18. Check Docker Resource Usage

```bash
sudo docker stats
```

---

# 19. Remove Unused Docker Resources

```bash
sudo docker system prune -a
```

---

# 20. Common Deployment Workflow (Use Every Time)

```bash
ssh -i "campusthrift.pem" ubuntu@56.228.36.223

cd ~/campusthrift

git pull

sudo docker compose down

sudo docker compose up --build -d

sudo docker ps
```

---

# Common Errors

### Error

```
fatal: not a git repository
```

Solution:

```bash
cd ~/campusthrift
```

Then:

```bash
git pull
```

---

### Error

```
502 Bad Gateway
```

Check:

```bash
sudo docker logs campusthrift-server --tail=100
```

and

```bash
sudo docker logs campusthrift-client --tail=100
```

---

### Error

```
yaml: did not find expected key
```

Cause:

Incorrect indentation in `docker-compose.yml`.

---

### Error

```
Permission denied while trying to connect to docker.sock
```

Use:

```bash
sudo docker ps
```

or add your user to the Docker group later.

---

# Website URL

Frontend:

```
http://56.228.36.223
```

Backend API:

```
http://56.228.36.223:5000
```