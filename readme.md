# MERN Monorepo

A MERN stack app where the React frontend and Express API run together in a single Docker container.

- Dev: http://localhost:5000
- Prod: https://mern.fire-line.tech

## Development Setup

Requirements: Git and Docker Desktop.

```bash
git clone https://github.com/Fall2026-Classes/cop4331-mern-web.git mern-app
cd mern-app
docker compose up --build -d
```

Open http://localhost:5000.

To rebuild after making changes:

```bash
docker compose up --build -d
```

## Production Setup (Ubuntu)

Before starting, point a DNS A record for mern.fire-line.tech to the server's public IP.

### 1. Install Docker, Nginx, and Certbot

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker nginx
```

### 2. Clone and start the app

```bash
git clone <your-repo-url> mern-app
cd mern-app
sudo docker compose up --build -d
```

The app runs on port 5000.

### 3. Configure Nginx

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo nano /etc/nginx/sites-available/mern-app
```

Paste the following:

```nginx
server {
    listen 80;
    server_name mern.fire-line.tech;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/mern-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Enable HTTPS

```bash
sudo certbot --nginx -d mern.fire-line.tech
```

Choose the option to redirect HTTP to HTTPS when prompted.

### 5. Configure the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Note: Docker bypasses ufw, so port 5000 may still be reachable directly. To keep it private, set the port mapping in docker-compose.yml to "127.0.0.1:5000:5000".

The app is now available at https://mern.fire-line.tech.

### Deploying updates

```bash
cd mern-app
git pull
sudo docker compose up --build -d
```

## Commands

Use sudo on the production server.

```bash
docker compose logs -f          # view logs
docker compose ps               # check status
docker compose down             # stop the app
docker compose up --build -d    # rebuild and restart
```