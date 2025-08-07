# Chat Analyzer - Hướng Dẫn Sử Dụng

## Tổng Quan

Chat Analyzer là một tính năng tự động phân tích tin nhắn trong Discord channel và đánh giá mức độ quan trọng bằng AI. Khi phát hiện nội dung quan trọng (HIGH), hệ thống sẽ gửi thông báo đến các user được chỉ định.

## Cấu Hình

### 1. Cấu hình cơ bản trong `.env`

```env
# Bật/tắt Chat Analyzer
CHAT_ANALYZER_ENABLED=true

# ID của channel cần theo dõi
TARGET_CHANNEL_ID=your_channel_id_here

# Prompt tùy chỉnh (để trống để dùng prompt mặc định)
CHAT_ANALYZER_PROMPT=

# Thông báo
NOTIFICATION_ENABLED=true
NOTIFICATION_USER_IDS=user_id_1,user_id_2,user_id_3
```

### 2. Cách lấy Channel ID

1. Bật Developer Mode trong Discord (User Settings > Advanced > Developer Mode)
2. Click chuột phải vào channel cần theo dõi
3. Chọn "Copy ID"
4. Paste vào `TARGET_CHANNEL_ID`

### 3. Cách lấy User ID

1. Bật Developer Mode trong Discord
2. Click chuột phải vào user cần thông báo
3. Chọn "Copy ID"
4. Thêm vào `NOTIFICATION_USER_IDS` (phân cách bằng dấu phẩy)

## Prompt Tùy Chỉnh

### Prompt Mặc Định

Hệ thống sẽ phân tích theo các tiêu chí:

**HIGH (Quan trọng cao):**
- Thảo luận về dự án mới, công việc quan trọng
- Quyết định, thống nhất, kế hoạch cụ thể
- Vấn đề cần giải quyết ngay, khủng hoảng
- Thông báo quan trọng, sự kiện lớn
- Thảo luận về deadline, timeline, budget
- Quyết định về nhân sự, tổ chức
- Thảo luận về hợp đồng, thỏa thuận

**MEDIUM (Quan trọng trung bình):**
- Thảo luận kỹ thuật, chia sẻ kiến thức
- Hỏi đáp, tư vấn, góp ý về công việc
- Cập nhật tiến độ dự án
- Thảo luận về công cụ, phương pháp làm việc
- Thảo luận về quy trình, workflow

**LOW (Không quan trọng):**
- Chào hỏi, chuyện phiếm, spam
- Emoji, reaction, tin nhắn ngắn
- Thảo luận cá nhân không liên quan đến công việc
- Chia sẻ meme, video giải trí

### Tạo Prompt Tùy Chỉnh

Bạn có thể tạo prompt riêng bằng cách thêm vào `.env`:

```env
CHAT_ANALYZER_PROMPT=Phân tích đoạn chat sau và đánh giá mức độ quan trọng:

**HƯỚNG DẪN PHÂN TÍCH:**

**HIGH (Quan trọng cao):**
- [Thêm tiêu chí của bạn]

**MEDIUM (Quan trọng trung bình):**
- [Thêm tiêu chí của bạn]

**LOW (Không quan trọng):**
- [Thêm tiêu chí của bạn]

**Trả lời theo format chính xác:**
IMPORTANCE: [LOW/MEDIUM/HIGH]
SUMMARY: [Tóm tắt ngắn gọn nội dung quan trọng, hoặc "Không có gì đáng chú ý"]
```

## Tính Năng Thông Báo

### Cấu Hình Thông Báo

1. **Bật thông báo:**
   ```env
   NOTIFICATION_ENABLED=true
   ```

2. **Thêm user nhận thông báo:**
   ```env
   NOTIFICATION_USER_IDS=123456789,987654321
   ```

### Cách Hoạt Động

- Khi phát hiện tin nhắn có đánh giá **HIGH**, bot sẽ:
  1. Lưu vào database (`important_logs`)
  2. Gửi DM đến tất cả user trong `NOTIFICATION_USER_IDS`
  3. Hiển thị embed với thông tin chi tiết

### Ví Dụ Thông Báo

```
🚨 THÔNG BÁO QUAN TRỌNG - HIGH

Dự án mới sẽ mang lại sự đổi mới và tạo ra cơ hội phát triển cho nhóm.

📊 Thông Tin
Số tin nhắn: 3
Tác giả: user1, user2, user3

⏰ Thời Gian
7/8/2024, 10:30:45 AM
```

## Commands

### Xem thống kê Chat Analyzer

```
!analyzerstats
```

Hiển thị:
- Tổng số tin nhắn đã phân tích
- Số tin nhắn đang chờ xử lý
- Số log quan trọng
- Tin nhắn hôm nay
- Trạng thái cấu hình

## Database Collections

### `message_logs`
Lưu tất cả tin nhắn từ channel được theo dõi:
```javascript
{
  messageId: "string",
  authorId: "string", 
  authorName: "string",
  content: "string",
  channelId: "string",
  createdAt: Date,
  status: "pending|done|error",
  processedAt: Date
}
```

### `important_logs`
Lưu kết quả phân tích quan trọng:
```javascript
{
  summary: "string",
  messageIds: ["string"],
  gptResponse: "string",
  importanceLevel: "low|medium|high",
  createdAt: Date,
  messageCount: number,
  authors: ["string"]
}
```

## Test

### Chạy Test

```bash
node testChatAnalyzer.js
```

Test sẽ:
1. Kiểm tra cấu hình
2. Tạo tin nhắn test
3. Chạy phân tích
4. Hiển thị thống kê

### Ví Dụ Kết Quả Test

```
🧪 Bắt đầu test Chat Analyzer...

📋 Cấu hình Chat Analyzer:
- Enabled: true
- Target Channel: 1396334789522620537
- Custom Prompt: Không
- Notification Enabled: true
- Notification Users: user_id_1,user_id_2

📝 Test lưu tin nhắn...
📝 Đã lưu tin nhắn: user1 - Chúng ta cần thảo luận về dự án mới...

🔍 Test phân tích chat...
🔍 Bắt đầu phân tích chat...
📋 Tìm thấy 5 tin nhắn cần phân tích
🔍 Kết quả phân tích: HIGH - Dự án mới sẽ mang lại...
💾 Lưu vào important_logs: HIGH
🔍 Đã lưu phân tích quan trọng: HIGH - Dự án mới sẽ mang lại...
📤 Mock DM sent to user_id_1: 🚨 THÔNG BÁO QUAN TRỌNG - HIGH

📊 Thống kê sau phân tích:
- Total Messages: 5
- Pending Messages: 0
- Important Logs: 1
- Today Messages: 5

✅ Test hoàn thành!
```

## Troubleshooting

### Bot không phân tích tin nhắn

1. Kiểm tra `CHAT_ANALYZER_ENABLED=true`
2. Kiểm tra `TARGET_CHANNEL_ID` đúng
3. Đảm bảo bot có quyền đọc tin nhắn trong channel

### Không nhận được thông báo

1. Kiểm tra `NOTIFICATION_ENABLED=true`
2. Kiểm tra `NOTIFICATION_USER_IDS` đúng format
3. Đảm bảo bot có quyền gửi DM đến user

### GPT không phân tích đúng

1. Kiểm tra `OPENAI_API_KEY` hợp lệ
2. Thử tạo prompt tùy chỉnh phù hợp với nhu cầu
3. Kiểm tra log để xem lỗi GPT

### Database lỗi

1. Kiểm tra `MONGODB_URI` và `MONGODB_DB`
2. Đảm bảo MongoDB đang chạy
3. Kiểm tra quyền truy cập database

## Lưu Ý Bảo Mật

1. **Không chia sẻ API keys** trong code
2. **Giới hạn quyền bot** chỉ những gì cần thiết
3. **Kiểm tra user IDs** trước khi thêm vào thông báo
4. **Backup database** định kỳ
5. **Monitor logs** để phát hiện lỗi

## Tùy Chỉnh Nâng Cao

### Thay đổi chu kỳ phân tích

Trong `chatAnalyzer.js`, thay đổi:
```javascript
ANALYSIS_INTERVAL: 2 * 60 * 1000, // 2 phút
```

### Thay đổi số tin nhắn xử lý mỗi lần

```javascript
BATCH_SIZE: 10, // Số tin nhắn xử lý mỗi lần
```

### Thêm màu sắc cho embed

Trong `createImportantAnalysisEmbed()`:
```javascript
const colors = {
    [IMPORTANCE_LEVELS.LOW]: '#00FF00',    // Xanh lá
    [IMPORTANCE_LEVELS.MEDIUM]: '#FFA500', // Cam
    [IMPORTANCE_LEVELS.HIGH]: '#FF0000'    // Đỏ
};
``` 