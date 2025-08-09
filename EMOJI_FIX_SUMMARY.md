# Emoji Message Analysis Fix

## Vấn đề
Chat analyzer đang báo sai cho các tin nhắn chỉ chứa emoji (như `:AniNhi~17:`) là HIGH thay vì LOW.

## Nguyên nhân
1. **Lưu tin nhắn**: Function `saveMessageToDatabase` không lọc emoji-only messages
2. **Phân tích GPT**: GPT model hiểu nhầm nội dung bên trong custom emoji (ví dụ: "ngu" trong `:AniNhi~17:`)
3. **Thiếu quy tắc**: Không có quy tắc xử lý emoji trong prompt

## Giải pháp

### 1. Cải thiện `saveMessageToDatabase` function
```javascript
// Thêm emoji detection
const isEmojiOnly = (text) => {
    // Loại bỏ custom emoji format (:name:)
    const withoutCustomEmoji = text.replace(/:[^:]+:/g, '');
    
    // Loại bỏ Unicode emoji và các ký tự đặc biệt
    const withoutUnicodeEmoji = withoutCustomEmoji.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    
    // Loại bỏ các ký tự đặc biệt khác
    const cleanText = withoutUnicodeEmoji.replace(/[^\w\s]/g, '').trim();
    
    return cleanText === '';
};

if (isEmojiOnly(content)) {
    console.log(`🎭 Bỏ qua emoji-only message: ${content}`);
    return;
}
```

### 2. Cải thiện `analyzeMessagesWithGPT` function
- Thêm pre-filter để bỏ qua emoji-only messages
- Thêm check để trả về LOW nếu tất cả messages đều là emoji-only
- Cải thiện prompt với quy tắc xử lý emoji

### 3. Cập nhật prompt
```
**QUY TẮC XỬ LÝ EMOJI:**
- Emoji-only messages (chỉ chứa emoji, không có text) = LOW
- Custom emoji format (:name:) = LOW nếu chỉ có emoji
- Emoji + text bình thường = phân tích theo text
- Không phân tích nội dung bên trong custom emoji (:name:)

**BẮT BUỘC ĐÁNH GIÁ LOW KHI:**
- Chỉ chứa emoji (bao gồm custom emoji :name:)
```

## Kết quả test
✅ **Test Case 8**: `:AniNhi~17:` → LOW (trước đây là HIGH)
✅ **Test Case 9**: `👍 Hello` → LOW (vẫn đúng)
✅ **Multiple emojis**: `😀😍🎉` → LOW

## Loại emoji được hỗ trợ
1. **Custom emoji**: `:name:`, `:AniNhi~17:`
2. **Unicode emoji**: `😀`, `👍`, `🎉`
3. **Mixed content**: `👍 Hello` (emoji + text)

## Lợi ích
- Giảm false positive cho emoji messages
- Tăng độ chính xác của chat analyzer
- Không ảnh hưởng đến phân tích text bình thường
- Hỗ trợ đầy đủ các loại emoji phổ biến
