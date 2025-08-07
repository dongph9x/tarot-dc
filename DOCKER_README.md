# 🐳 Docker Setup - Tarot Discord Bot

## 🚀 Quick Start

### 1. Cấu hình Environment
```bash
# Copy file environment
cp env.example .env

# Chỉnh sửa file .env với thông tin của bạn
nano .env
```

### 2. Build và Chạy
```bash
# Build image
./scripts/docker.sh build

# Chạy production
./scripts/docker.sh up

# Hoặc chạy development (với hot reload)
./scripts/docker.sh dev
```

### 3. Xem Logs
```bash
# Xem logs real-time
./scripts/docker.sh logs

# Hoặc
docker compose logs -f discord-bot
```

## 📋 Commands

### Production
```bash
# Start services
./scripts/docker.sh up

# Stop services  
./scripts/docker.sh down

# Restart services
./scripts/docker.sh restart

# Check status
./scripts/docker.sh status
```

### Development
```bash
# Start with hot reload
./scripts/docker.sh dev

# Access container shell
./scripts/docker.sh shell

# Check environment variables
./scripts/docker.sh env
```

### Maintenance
```bash
# Rebuild without cache
./scripts/docker.sh rebuild

# Clean up resources
./scripts/docker.sh clean
```

## 🔧 Configuration

### Environment Variables
File `.env` cần có các biến sau:

```env
# Discord Bot
DISCORD_TOKEN=your_discord_bot_token

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# MongoDB (Online)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
MONGODB_DB=tarot_bot

# Chat Analyzer
CHAT_ANALYZER_ENABLED=true
TARGET_CHANNEL_ID=your_channel_id
NOTIFICATION_USER_IDS=user_id_1,user_id_2
NOTIFICATION_ENABLED=true
```

### Volumes
- `./rwsa:/app/rwsa:ro` - Card images (read-only)
- `./logs:/app/logs` - Application logs

## 🐛 Troubleshooting

### Common Issues

1. **Container không start**
```bash
# Check logs
./scripts/docker.sh logs

# Check environment
./scripts/docker.sh env

# Rebuild
./scripts/docker.sh rebuild
```

2. **Permission issues**
```bash
# Fix script permissions
chmod +x scripts/docker.sh
```

3. **Environment variables missing**
```bash
# Check if .env exists
ls -la .env

# Copy from example
cp env.example .env
```

4. **MongoDB connection issues**
- Kiểm tra MONGODB_URI trong .env
- Đảm bảo MongoDB Atlas whitelist IP của bạn

### Debug Commands
```bash
# Access container
./scripts/docker.sh shell

# Check container status
docker compose ps

# View container details
docker compose exec discord-bot env

# Check file permissions
docker compose exec discord-bot ls -la
```

## 📊 Monitoring

### Health Checks
- Container có health check tự động
- Kiểm tra mỗi 30s
- Restart tự động nếu fail

### Logs
- Logs được rotate tự động
- Max 10MB per file
- Giữ 3 files

### Resource Usage
```bash
# Check resource usage
docker stats

# Check disk usage
docker system df
```

## 🔄 Updates

### Update Code
```bash
# Pull latest code
git pull

# Rebuild and restart
./scripts/docker.sh rebuild
```

### Update Dependencies
```bash
# Update package.json
npm update

# Rebuild
./scripts/docker.sh rebuild
```

## 📝 Notes

- **Security**: Container chạy với non-root user
- **Performance**: Sử dụng Node.js Alpine để giảm size
- **Development**: Có hot reload với nodemon
- **Production**: Optimized cho production với health checks
