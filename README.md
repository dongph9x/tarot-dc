# Tarot Discord Bot

Discord bot để bói bài tarot với dữ liệu tiếng Việt và tính năng Chat Analyzer.

## 🚀 Cài đặt và Chạy

### Cách 1: Chạy trực tiếp

1. **Clone repository:**
```bash
git clone <repository-url>
cd tarot-dc
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Cấu hình environment:**
```bash
cp env.example .env
# Chỉnh sửa file .env với thông tin của bạn
```

4. **Chạy bot:**
```bash
npm start
```

### Cách 2: Sử dụng Docker (Khuyến nghị)

#### Quick Start
```bash
# 1. Cấu hình environment
cp env.example .env
# Chỉnh sửa file .env với thông tin của bạn

# 2. Build và chạy
./scripts/docker.sh build
./scripts/docker.sh up

# 3. Xem logs
./scripts/docker.sh logs
```

#### Production Commands
```bash
# Build image
./scripts/docker.sh build

# Start services
./scripts/docker.sh up

# Stop services
./scripts/docker.sh down

# Restart services
./scripts/docker.sh restart

# Check status
./scripts/docker.sh status

# View logs
./scripts/docker.sh logs
```

#### Development Commands
```bash
# Start with hot reload
./scripts/docker.sh dev

# Access container shell
./scripts/docker.sh shell

# Check environment variables
./scripts/docker.sh env
```

#### Maintenance Commands
```bash
# Rebuild without cache
./scripts/docker.sh rebuild

# Clean up resources
./scripts/docker.sh clean
```

#### Manual Docker Commands
```bash
# Build image
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f discord-bot

# Access container
docker compose exec discord-bot sh

# Check status
docker compose ps
```

## 📋 Cấu hình

### Environment Variables

Tạo file `.env` từ `env.example` và cấu hình:

```env
# Discord Bot Token
DISCORD_TOKEN=your_discord_bot_token_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB Configuration (online)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
MONGODB_DB=tarot_bot

# Tarot Bot Configuration
# ID của channel cho phép sử dụng chức năng bói bài (để trống để cho phép tất cả channels)
TAROT_CHANNEL_ID=your_tarot_channel_id_here

# Chat Analyzer Configuration
CHAT_ANALYZER_ENABLED=true
TARGET_CHANNEL_ID=your_target_channel_id_here

# Chat Analyzer Prompt (tùy chọn)
CHAT_ANALYZER_PROMPT=

# Notification Configuration
NOTIFICATION_USER_IDS=user_id_1,user_id_2,user_id_3
NOTIFICATION_ENABLED=true
```

### Docker Configuration

#### Volumes
- `./rwsa:/app/rwsa:ro` - Card images (read-only)
- `./logs:/app/logs` - Application logs

#### Health Checks
- Tự động kiểm tra mỗi 30s
- Restart container nếu fail
- Log rotation (10MB max, 3 files)

#### Security
- Non-root user (nodejs:1001)
- Read-only file system cho card images
- Environment variables từ `.env`

## 🔧 Tính năng

### Tarot Reading
- Bói bài tarot với 78 lá bài
- Hỗ trợ tiếng Việt
- Tích hợp OpenAI GPT cho giải thích
- **Channel restriction**: Có thể giới hạn sử dụng trong channel cụ thể

### Chat Analyzer
- Phân tích chat tự động
- Kiểm duyệt nội dung tiếng Việt
- Thông báo cho admin
- Cảnh báo trực tiếp trong channel

## 📁 Cấu trúc Project

```
tarot-dc/
├── bot.js                    # Main bot file
├── database.js               # MongoDB connection
├── chatAnalyzer.js           # Chat analysis logic
├── chatgptReader.js          # OpenAI integration
├── card.js                   # Tarot card logic
├── cardUtils.js              # Card utilities
├── rwsa/                     # Card images (78 files)
├── scripts/
│   └── docker.sh            # Docker management script
├── logs/                     # Application logs
├── Dockerfile                # Docker configuration
├── docker-compose.yml        # Production setup
├── docker-compose.override.yml # Development setup
├── .dockerignore             # Docker ignore rules
├── .env                      # Environment variables
├── env.example               # Environment template
└── README.md                 # This file
```

## 🐳 Docker Configuration

### Production
- ✅ Node.js 18 Alpine (lightweight)
- ✅ Non-root user (security)
- ✅ Health checks (auto-restart)
- ✅ Log rotation (10MB max, 3 files)
- ✅ Volume mounting cho card images
- ✅ Environment variables từ `.env`

### Development
- ✅ Hot reload với nodemon
- ✅ Source code mounting
- ✅ Debug port exposure (9229)
- ✅ Development overrides

### Features
- ✅ MongoDB online support
- ✅ Discord bot integration
- ✅ OpenAI GPT integration
- ✅ Chat Analyzer với AI
- ✅ Tarot card system
- ✅ Notification system

## 🔍 Troubleshooting

### Docker Issues
```bash
# Xem logs chi tiết
./scripts/docker.sh logs

# Rebuild nếu có lỗi
./scripts/docker.sh rebuild

# Kiểm tra environment variables
./scripts/docker.sh env

# Access container shell
./scripts/docker.sh shell

# Check container status
./scripts/docker.sh status
```

### Bot Issues
- Kiểm tra Discord token
- Kiểm tra OpenAI API key
- Kiểm tra MongoDB connection
- Xem logs trong console

## 🚀 Deployment

### Production Deployment
```bash
# 1. Clone repository
git clone <repository-url>
cd tarot-dc

# 2. Cấu hình environment
cp env.example .env
# Chỉnh sửa .env với production values

# 3. Build và deploy
./scripts/docker.sh build
./scripts/docker.sh up -d

# 4. Monitor
./scripts/docker.sh logs
```

### Monitoring
```bash
# Check container status
./scripts/docker.sh status

# View real-time logs
./scripts/docker.sh logs

# Check resource usage
docker stats

# Access container for debugging
./scripts/docker.sh shell
```

### Backup & Recovery
```bash
# Backup logs
docker compose cp discord-bot:/app/logs ./backup/

# Restore from backup
docker compose cp ./backup/logs discord-bot:/app/

# Update and restart
git pull
./scripts/docker.sh rebuild
```

## 📝 License

MIT License