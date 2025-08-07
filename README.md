# 🤖 AI Tarot Discord Bot

Bot Discord bói bài tarot với AI ChatGPT, 78 lá bài truyền thống, hỗ trợ đầy đủ tiếng Việt.

## ✨ Tính Năng

- 🃏 **78 lá bài tarot đầy đủ** - 22 Major Arcana + 56 Minor Arcana
- 🤖 **100% AI-Powered** - Tất cả lệnh đều sử dụng ChatGPT luận bài
- 🎯 **Chuyên đề cụ thể** - Tình yêu, sự nghiệp, tài chính
- 🔀 **Bài xuôi/ngược** - Mỗi lá có thể xuất hiện ở 2 hướng với ý nghĩa khác nhau
- 💬 **Prefix Commands** - Sử dụng prefix `!` dễ nhớ và nhanh chóng
- 🎨 **Hiển thị ảnh bài** - Kèm theo ảnh minh họa đẹp mắt
- 🇻🇳 **Hoàn toàn tiếng Việt** - Tên bài và luận giải đều bằng tiếng Việt
- 🗄️ **MongoDB Storage** - Lưu trữ quota sử dụng trong database
- ⏰ **Giới hạn thông minh** - 3 lần bói bài/ngày/user, tự động reset

## 🎮 Các Lệnh

### 🔮 Lệnh Cơ Bản
| Lệnh | Mô tả |
|------|-------|
| `!tarot` | Rút 1 lá bài + luận giải AI chi tiết |
| `!tarot3` | Rút 3 lá bài (Quá khứ-Hiện tại-Tương lai) + phân tích AI |
| `!tarot5` | Rút 5 lá bài (Phân tích tổng quan) + luận giải AI |
| `!tarotdaily` | Bài hàng ngày với lời khuyên từ ChatGPT |

### 🎯 Lệnh Chuyên Đề  
| Lệnh | Mô tả |
|------|-------|
| `!tarotlove` | Luận bài tình yêu 3 lá với AI chuyên sâu |
| `!tarotwork` | Luận bài sự nghiệp 3 lá với AI chuyên nghiệp |
| `!tarotmoney` | Luận bài tài chính 3 lá với AI thực tế |

### 🛠️ Lệnh Hỗ Trợ
| Lệnh | Mô tả |
|------|-------|
| `!tarotselect` | Chọn bài thủ công để luận giải với AI |
| `!tarothelp` | Hiển thị hướng dẫn sử dụng |
| `!tarotstats` | Xem thống kê sử dụng và quota còn lại |

## 🚀 Cài Đặt

### 1. Chuẩn bị

- Node.js 16.0.0 trở lên
- Tài khoản Discord Developer  
- **Tài khoản OpenAI** (để sử dụng ChatGPT API)

### 2. Tạo Discord Bot

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Tạo **New Application**
3. Vào tab **Bot** → **Add Bot**
4. Copy **Token** (giữ bí mật!)
5. Bật **Message Content Intent** nếu cần

### 3. Mời Bot vào Server

1. Vào tab **OAuth2** → **URL Generator**
2. Chọn **Scopes**: `bot`, `applications.commands`
3. Chọn **Bot Permissions**: 
   - Send Messages
   - Read Messages
   - Read Message History
   - Attach Files
   - Embed Links
4. Copy URL và mời bot vào server

### 4. Cài Đặt Code

```bash
# Clone hoặc download source code
cd tarot-dc

# Cài đặt dependencies
npm install

# Tạo file .env từ template
cp env.example .env

# Sửa file .env và thêm tokens
# DISCORD_TOKEN=your_bot_token_here
# OPENAI_API_KEY=your_openai_api_key_here
# MONGODB_URI=mongodb://localhost:27017
# MONGODB_DB=tarot_bot
```

### 5. Cài Đặt MongoDB (Tùy Chọn)

Bot có thể hoạt động mà không cần MongoDB, nhưng để có tính năng lưu trữ quota chính xác:

**Local MongoDB:**
```bash
# Ubuntu/Debian
sudo apt install mongodb

# macOS (với Homebrew)
brew install mongodb-community

# Windows
# Download từ https://www.mongodb.com/try/download/community
```

**MongoDB Atlas (Cloud):**
1. Tạo tài khoản tại https://www.mongodb.com/atlas
2. Tạo cluster miễn phí
3. Lấy connection string và thêm vào .env

### 6. Chạy Bot

```bash
# Chạy production
npm start

# Hoặc chạy development (auto restart)
npm run dev
```

## 📁 Cấu Trúc Dự Án

```
tarot-dc/
├── bot.js              # File chính của bot
├── card.js             # Dữ liệu 78 lá bài tarot
├── cardUtils.js        # Utilities xử lý bài
├── package.json        # Dependencies và scripts
├── env.example         # Template file môi trường
├── README.md          # Hướng dẫn này
└── rwsa/              # Thư mục chứa ảnh bài (00.webp - 77.webp)
    ├── 00.webp        # The Fool
    ├── 01.webp        # The Magician
    ├── ...
    └── 77.webp        # King of Swords
```

## 🎯 Cách Hoạt Động

### 📊 Hệ Thống Quota

Bot có hệ thống giới hạn thông minh để đảm bảo trải nghiệm công bằng:

- **3 lần bói bài/ngày/user** - Bao gồm tất cả lệnh tarot
- **Tự động reset** - Quota được reset vào 00:00 UTC+7 mỗi ngày
- **Lưu trữ MongoDB** - Dữ liệu được lưu trong database để đảm bảo chính xác
- **Fallback mode** - Bot vẫn hoạt động nếu không có MongoDB

**Lệnh tính vào quota:**
- `!tarot`, `!tarot3`, `!tarot5`, `!tarotdaily`
- `!tarotlove`, `!tarotwork`, `!tarotmoney`, `!tarotselect`

**Lệnh không tính vào quota:**
- `!tarothelp`, `!tarotstats`

### ⏰ Cooldown System

Mỗi lệnh có thời gian chờ riêng để tránh spam:

- `!tarot`: 30 giây
- `!tarot3`: 1 phút
- `!tarot5`: 2 phút
- `!tarotdaily`: 24 giờ (1 lần/ngày)
- `!tarotlove/work/money`: 5 phút
- `!tarotselect`: 1 phút

### Mapping Bài và Ảnh

- Ảnh được đặt tên theo index: `00.webp` đến `77.webp`
- File `cardUtils.js` chứa mapping giữa index và dữ liệu bài
- Thứ tự: Major Arcana (0-21) → Pentacles (22-35) → Wands (36-49) → Cups (50-63) → Swords (64-77)

### Spread Types

**1 Lá Bài (`!tarot`)**
- Rút ngẫu nhiên 1 lá để xem vận mệnh tổng quát

**3 Lá Bài (`!tarot3`)**
- Quá khứ: Những yếu tố đã ảnh hưởng
- Hiện tại: Tình huống hiện tại
- Tương lai: Xu hướng phát triển

**5 Lá Bài (`!tarot5`)**
- Tình huống hiện tại
- Thử thách/Trở ngại
- Mục tiêu/Khát vọng
- Quá khứ ảnh hưởng
- Kết quả có thể

**Bài Hàng Ngày (`!tarotdaily`)**
- Rút 1 lá bài với lời khuyên từ ChatGPT cho ngày mới

**AI Luận Bài (`!tarotai [type]`)**
- `!tarotai single` - 1 lá bài với phân tích chi tiết
- `!tarotai three` - 3 lá bài với luận giải AI
- `!tarotai five` - 5 lá bài phân tích toàn diện

## 🛠️ Tùy Chỉnh

### Thêm Spread Mới

Chỉnh sửa file `bot.js` để thêm command mới:

```javascript
// Thêm vào mảng commands
new SlashCommandBuilder()
    .setName('tarot_custom')
    .setDescription('Spread tùy chỉnh của bạn'),

// Thêm case trong switch
case 'tarot_custom': {
    const cards = drawMultipleCards(7); // Số lá bài
    const positions = ['Vị trí 1', 'Vị trí 2', ...]; // Tên các vị trí
    // ... xử lý logic
}
```

### Thay Đổi Ảnh Bài

- Thay thế file trong thư mục `rwsa/`
- Giữ nguyên tên file (00.webp đến 77.webp)
- Định dạng khuyến nghị: WebP, kích thước 400x700px

## ⚠️ Lưu Ý

- **Bảo mật**: Không chia sẻ Discord Token
- **Giải trí**: Kết quả bói bài chỉ mang tính giải trí
- **Performance**: Bot tối ưu cho server nhỏ-vừa (<1000 thành viên)

## 🤝 Đóng Góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Dự án này sử dụng MIT License. Xem file `LICENSE` để biết thêm chi tiết.

## 🆘 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra console logs
2. Đảm bảo bot có đủ permissions
3. Xác nhận Discord Token đúng
4. Kiểm tra file ảnh trong thư mục `rwsa/`

---

**Chúc bạn có những buổi bói bài vui vẻ! 🔮✨**