const OpenAI = require('openai');

// Khởi tạo OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Templates prompt cho các loại đọc bài khác nhau
 */
const readingTemplates = {
    single: (card) => `
Bạn là một chuyên gia tarot có kinh nghiệm nhiều năm. Hãy luận giải chi tiết lá bài sau cho người hỏi:

**Lá bài:** ${card.name} (${card.orientation})
**Loại bài:** ${card.type === 'major' ? 'Major Arcana' : 'Minor Arcana'}
**Ý nghĩa cơ bản:** ${card.currentMeaning}

Hãy cung cấp:
1. **Giải thích sâu** về ý nghĩa của lá bài này trong bối cảnh hiện tại
2. **Lời khuyên thực tế** mà người hỏi có thể áp dụng
3. **Những điều cần chú ý** trong thời gian tới
4. **Câu hỏi để suy ngẫm** giúp người hỏi hiểu rõ hơn về tình huống

Hãy viết bằng tiếng Việt, phong cách ấm áp, dễ hiểu và khuyến khích tích cực.
`,

    threecards: (cards) => `
Bạn là một chuyên gia tarot có kinh nghiệm nhiều năm. Hãy luận giải spread 3 lá bài "Quá khứ - Hiện tại - Tương lai" sau:

**Quá khứ:** ${cards[0].name} (${cards[0].orientation})
- Ý nghĩa: ${cards[0].currentMeaning}

**Hiện tại:** ${cards[1].name} (${cards[1].orientation})  
- Ý nghĩa: ${cards[1].currentMeaning}

**Tương lai:** ${cards[2].name} (${cards[2].orientation})
- Ý nghĩa: ${cards[2].currentMeaning}

Hãy cung cấp:
1. **Phân tích dòng chảy thời gian** - Mối liên hệ giữa quá khứ, hiện tại và tương lai
2. **Những bài học** từ quá khứ mà người hỏi cần ghi nhớ
3. **Tình huống hiện tại** và cách xử lý tốt nhất
4. **Xu hướng tương lai** và cách chuẩn bị
5. **Lời khuyên tổng thể** cho toàn bộ hành trình

Hãy viết bằng tiếng Việt, tạo ra một câu chuyện mạch lạc và đầy cảm hứng.
`,

    fivecards: (cards) => `
Bạn là một chuyên gia tarot có kinh nghiệm nhiều năm. Hãy luận giải spread 5 lá bài phân tích tổng quan sau:

**1. Tình huống hiện tại:** ${cards[0].name} (${cards[0].orientation})
- Ý nghĩa: ${cards[0].currentMeaning}

**2. Thử thách/Trở ngại:** ${cards[1].name} (${cards[1].orientation})
- Ý nghĩa: ${cards[1].currentMeaning}

**3. Mục tiêu/Khát vọng:** ${cards[2].name} (${cards[2].orientation})
- Ý nghĩa: ${cards[2].currentMeaning}

**4. Quá khứ ảnh hưởng:** ${cards[3].name} (${cards[3].orientation})
- Ý nghĩa: ${cards[3].currentMeaning}

**5. Kết quả có thể:** ${cards[4].name} (${cards[4].orientation})
- Ý nghĩa: ${cards[4].currentMeaning}

Hãy cung cấp:
1. **Phân tích tình huống** hiện tại một cách toàn diện
2. **Chiến lược vượt qua** những thử thách đang gặp phải
3. **Con đường đạt được** mục tiêu và khát vọng
4. **Ảnh hưởng của quá khứ** và cách xử lý
5. **Dự báo kết quả** và các bước cần thực hiện
6. **Kế hoạch hành động** cụ thể cho người hỏi

Hãy viết bằng tiếng Việt, tạo ra một phân tích sâu sắc và hướng dẫn thực tế.
`,

    custom: (cards, question) => `
Bạn là một chuyên gia tarot có kinh nghiệm nhiều năm. Người hỏi có câu hỏi cụ thể và đã chọn ${cards.length} lá bài sau:

**Câu hỏi:** ${question}

**Các lá bài được chọn:**
${cards.map((card, index) => `
${index + 1}. ${card.name} (${card.orientation})
   - Ý nghĩa: ${card.currentMeaning}`).join('')}

Hãy cung cấp:
1. **Phân tích từng lá bài** trong bối cảnh câu hỏi
2. **Mối liên hệ** giữa các lá bài với nhau
3. **Câu trả lời** chi tiết cho câu hỏi đã đặt
4. **Lời khuyên thực tế** để áp dụng vào tình huống
5. **Những điều cần lưu ý** trong thời gian tới

Hãy viết bằng tiếng Việt, phong cách ấm áp và hướng đến giải pháp tích cực.
`
};

/**
 * Gửi yêu cầu luận bài đến ChatGPT
 * @param {string} type - Loại đọc bài: 'single', 'threecards', 'fivecards', 'custom'
 * @param {Array} cards - Mảng các lá bài
 * @param {string} question - Câu hỏi (chỉ dành cho custom)
 * @returns {Promise<string>} Kết quả luận bài
 */
async function getChatGPTReading(type, cards, question = '') {
    try {
        let prompt;
        
        switch (type) {
            case 'single':
                prompt = readingTemplates.single(cards[0]);
                break;
            case 'threecards':
                prompt = readingTemplates.threecards(cards);
                break;
            case 'fivecards':
                prompt = readingTemplates.fivecards(cards);
                break;
            case 'custom':
                prompt = readingTemplates.custom(cards, question);
                break;
            default:
                throw new Error(`Unknown reading type: ${type}`);
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Bạn là một chuyên gia tarot chuyên nghiệp, có kinh nghiệm nhiều năm trong việc đọc và luận giải bài tarot. Bạn luôn đưa ra lời khuyên tích cực, thực tế và có ý nghĩa."
                },
                {
                    role: "user", 
                    content: prompt
                }
            ],
            max_tokens: 1500,
            temperature: 0.7
        });

        return response.choices[0].message.content.trim();
        
    } catch (error) {
        console.error('ChatGPT API Error:', error);
        
        if (error.code === 'insufficient_quota') {
            return '❌ **Hết quota API OpenAI**\n\nVui lòng kiểm tra tài khoản OpenAI và thêm credit để sử dụng tính năng luận bài.';
        } else if (error.code === 'invalid_api_key') {
            return '❌ **API Key không hợp lệ**\n\nVui lòng kiểm tra lại OPENAI_API_KEY trong file .env';
        } else {
            return `❌ **Lỗi khi kết nối ChatGPT**\n\n${error.message}\n\nVui lòng thử lại sau hoặc kiểm tra kết nối mạng.`;
        }
    }
}

/**
 * Tạo prompt ngắn gọn cho việc đọc nhanh
 * @param {Array} cards - Mảng các lá bài
 * @returns {Promise<string>} Kết quả đọc nhanh
 */
async function getQuickReading(cards) {
    const cardNames = cards.map(card => `${card.name} (${card.orientation})`).join(', ');
    
    const prompt = `
Hãy đưa ra lời khuyên ngắn gọn (tối đa 200 từ) dựa trên các lá bài tarot sau: ${cardNames}

Tập trung vào:
- Thông điệp chính từ các lá bài
- Lời khuyên thực tế cho ngày hôm nay
- Năng lượng tích cực

Viết bằng tiếng Việt, phong cách ấm áp và khuyến khích.
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Bạn là chuyên gia tarot, đưa ra lời khuyên ngắn gọn và tích cực."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 300,
            temperature: 0.7
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        return 'Không thể tạo lời khuyên nhanh. Vui lòng thử lại sau.';
    }
}

module.exports = {
    getChatGPTReading,
    getQuickReading,
    readingTemplates
};