const data = {
    the_fool: {
      name: 'Gã Khờ',
      meaning: {
        upright: 'Khởi đầu mới, tự phát, niềm tin, ngây thơ',
        reversed: 'Liều lĩnh, mạo hiểm, phán đoán kém',
      },
      type: 'major',
    },
    the_magician: {
      name: 'Nhà Ảo Thuật',
      meaning: {
        upright: 'Sức mạnh, kỹ năng, tập trung, hành động, tháo vát',
        reversed: 'Ý chí yếu, bất an, thao túng, lên kế hoạch kém',
      },
      type: 'major',
    },
    the_high_priestess: {
      name: 'Nữ Tư Tế Tối Cao',
      meaning: {
        upright: 'Trực giác, kiến thức thiêng liêng, nữ tính thiêng liêng, tiềm thức',
        reversed: 'Bí mật, im lặng, rút lui, cảm thấy lạc lõng',
      },
      type: 'major',
    },
    the_empress: {
      name: 'Nữ Hoàng',
      meaning: {
        upright: 'Sự sung túc, thiên nhiên, sinh sản, niềm vui, nuôi dưỡng',
        reversed: 'Sự phụ thuộc, ngột ngạt, thiếu phát triển cá nhân, trống rỗng',
      },
      type: 'major',
    },
    the_emperor: {
      name: 'Hoàng Đế',
      meaning: {
        upright: 'Quyền lực, cấu trúc, kiểm soát, hình tượng người cha, sự ổn định',
        reversed: 'Sự độc tài, cứng nhắc, thiếu kiểm soát, bướng bỉnh',
      },
      type: 'major',
    },
    the_hierophant: {
      name: 'Giáo Hoàng',
      meaning: {
        upright: 'Truyền thống, tuân thủ, đạo đức, luân lý, giáo dục, hướng dẫn',
        reversed: 'Nổi loạn, không tuân thủ, cách tiếp cận mới, thách thức truyền thống',
      },
      type: 'major',
    },
    the_lovers: {
      name: 'Những Người Yêu Nhau',
      meaning: {
        upright: 'Các mối quan hệ, sự hài hòa, những lựa chọn, tính hai mặt, sự hợp nhất',
        reversed: 'Sự mất cân bằng, bất hòa, xung đột, những lựa chọn tồi tệ',
      },
      type: 'major',
    },
    the_chariot: {
      name: 'Cỗ Xe',
      meaning: {
        upright: 'Ý chí, định hướng, kiểm soát, quyết tâm, thành công',
        reversed: 'Thiếu kiểm soát, thiếu định hướng, trở ngại, sự nghi ngờ bản thân',
      },
      type: 'major',
    },
    strength: {
      name: 'Sức Mạnh',
      meaning: {
        upright: 'Lòng dũng cảm, lòng trắc ẩn, sức mạnh nội tại, kiểm soát, khả năng phục hồi',
        reversed: 'Sự yếu đuối, nghi ngờ bản thân, thiếu kiểm soát, bất an',
      },
      type: 'major',
    },
    the_hermit: {
      name: 'Ẩn Sĩ',
      meaning: {
        upright: 'Sự suy ngẫm, cô độc, sự khôn ngoan, tìm kiếm sự thật, sự hướng dẫn nội tâm',
        reversed: 'Sự cô lập, cô đơn, rút lui, từ chối sự giúp đỡ',
      },
      type: 'major',
    },
    wheel_of_fortune: {
      name: 'Bánh Xe Vận Mệnh',
      meaning: {
        upright: 'Các chu kỳ, định mệnh, bước ngoặt, nghiệp, may mắn',
        reversed: 'Vận rủi, các chu kỳ tiêu cực, sự chậm trễ, những sự kiện bất ngờ',
      },
      type: 'major',
    },
    justice: {
      name: 'Công Lý',
      meaning: {
        upright: 'Sự công bằng, sự thật, luật pháp, nhân quả, sự chính trực',
        reversed: 'Sự bất công, không công bằng, các vấn đề pháp lý, sự dối trá',
      },
      type: 'major',
    },
    the_hanged_man: {
      name: 'Người Treo Cổ',
      meaning: {
        upright: 'Sự hy sinh, sự đầu hàng, góc nhìn mới, buông bỏ',
        reversed: 'Sự thương hại bản thân, đạo đức giả, chống lại sự thay đổi, trì trệ',
      },
      type: 'major',
    },
    death: {
      name: 'Cái Chết',
      meaning: {
        upright: 'Sự kết thúc, sự biến đổi, sự thay đổi, sự chuyển tiếp',
        reversed: 'Chống lại sự thay đổi, sợ hãi sự kết thúc, sự trì trệ',
      },
      type: 'major',
    },
    temperance: {
      name: 'Điều Độ',
      meaning: {
        upright: 'Sự cân bằng, sự hài hòa, sự điều độ, sự kiên nhẫn, mục đích',
        reversed: 'Sự mất cân bằng, sự thái quá, thiếu tầm nhìn dài hạn, sự thiếu kiên nhẫn',
      },
      type: 'major',
    },
    the_devil: {
      name: 'Ác Quỷ',
      meaning: {
        upright: 'Sự nghiện ngập, sự hạn chế, chủ nghĩa vật chất, sự trói buộc',
        reversed: 'Sự tự do, sự giải thoát, vượt qua sự nghiện ngập, giành lại sức mạnh',
      },
      type: 'major',
    },
    the_tower: {
      name: 'Tháp',
      meaning: {
        upright: 'Sự thay đổi đột ngột, sự hỗn loạn, sự tiết lộ, sự phá hủy',
        reversed: 'Chống lại sự thay đổi, tránh được thảm họa, sợ hãi sự sụp đổ',
      },
      type: 'major',
    },
    the_star: {
      name: 'Ngôi Sao',
      meaning: {
        upright: 'Hy vọng, cảm hứng, sự chữa lành, niềm tin, sự đổi mới',
        reversed: 'Sự tuyệt vọng, thiếu niềm tin, nghi ngờ bản thân, cảm thấy lạc lõng',
      },
      type: 'major',
    },
    the_moon: {
      name: 'Mặt Trăng',
      meaning: {
        upright: 'Trực giác, ảo ảnh, nỗi sợ hãi, lo lắng, tiềm thức',
        reversed: 'Sự rõ ràng, giải phóng nỗi sợ hãi, khám phá bí mật',
      },
      type: 'major',
    },
    the_sun: {
      name: 'Mặt Trời',
      meaning: {
        upright: 'Niềm vui, thành công, năng lượng, sức sống, sự tích cực',
        reversed: 'Nỗi buồn, sự tiêu cực, thiếu năng lượng, cảm thấy kiệt sức',
      },
      type: 'major',
    },
    judgement: {
      name: 'Phán Xét',
      meaning: {
        upright: 'Sự phản ánh, đổi mới, thức tỉnh, tiếng gọi bên trong, trách nhiệm',
        reversed: 'Sự nghi ngờ bản thân, phủ nhận, bỏ qua tiếng gọi, tự chỉ trích',
      },
      type: 'major',
    },
    the_world: {
      name: 'Thế Giới',
      meaning: {
        upright: 'Sự hoàn thành, trọn vẹn, hài hòa, tích hợp, du lịch',
        reversed: 'Sự незавершение, thiếu kết thúc, cảm thấy mắc kẹt, muốn nhiều hơn',
      },
      type: 'major',
    },
    ace_of_pentacles: {
      name: 'Át Tiền',
      meaning: {
        upright: 'Cơ hội mới, thịnh vượng, dồi dào, hiện thực hóa',
        reversed: 'Mất cơ hội, thiếu nguồn lực, tham lam, đầu tư kém',
      },
      type: 'minor',
    },
    two_of_pentacles: {
      name: 'Hai Tiền',
      meaning: {
        upright: 'Cân bằng, khả năng thích ứng, xoay sở nguồn lực, linh hoạt',
        reversed: 'Mất cân bằng, thiếu tổ chức, quá tải, căng thẳng tài chính',
      },
      type: 'minor',
    },
    three_of_pentacles: {
      name: 'Ba Tiền',
      meaning: {
        upright: 'Làm việc nhóm, cộng tác, học hỏi, phát triển kỹ năng, được công nhận',
        reversed: 'Thiếu làm việc nhóm, chất lượng công việc kém, thiếu công nhận',
      },
      type: 'minor',
    },
    four_of_pentacles: {
      name: 'Bốn Tiền',
      meaning: {
        upright: 'An toàn, kiểm soát, chiếm hữu, tiết kiệm, ổn định',
        reversed: 'Mất mát, rộng lượng, tiêu xài hoang phí, bất an',
      },
      type: 'minor',
    },
    five_of_pentacles: {
      name: 'Năm Tiền',
      meaning: {
        upright: 'Khó khăn, mất mát, nghèo đói, cô lập, lo lắng',
        reversed: 'Phục hồi, giúp đỡ, tìm ra giải pháp, nghèo nàn tinh thần',
      },
      type: 'minor',
    },
    six_of_pentacles: {
      name: 'Sáu Tiền',
      meaning: {
        upright: 'Hào phóng, chia sẻ, từ thiện, nhận quà, cân bằng',
        reversed: 'Ích kỷ, mất cân bằng, keo kiệt, cảm thấy mắc nợ',
      },
      type: 'minor',
    },
    seven_of_pentacles: {
      name: 'Bảy Tiền',
      meaning: {
        upright: 'Kiên nhẫn, đầu tư, tầm nhìn dài hạn, phần thưởng, kiên trì',
        reversed: 'Thiếu kiên nhẫn, thiếu phần thưởng, bỏ cuộc quá sớm, đầu tư kém',
      },
      type: 'minor',
    },
    eight_of_pentacles: {
      name: 'Tám Tiền',
      meaning: {
        upright: 'Kỹ năng, tay nghề, sự tận tâm, tỉ mỉ',
        reversed: 'Thiếu nỗ lực, chất lượng công việc kém, cảm thấy thiếu cảm hứng',
      },
      type: 'minor',
    },
    nine_of_pentacles: {
      name: 'Chín Tiền',
      meaning: {
        upright: 'Độc lập, sang trọng, tự lực, sung túc, thoải mái',
        reversed: 'Phụ thuộc, bất an, tiêu xài quá mức, thiếu tự trọng',
      },
      type: 'minor',
    },
    ten_of_pentacles: {
      name: 'Mười Tiền',
      meaning: {
        upright: 'Giàu có, thừa kế, an toàn, di sản gia đình, thành công lâu dài',
        reversed: 'Mất mát tài chính, bất ổn, xung đột gia đình, mạo hiểm',
      },
      type: 'minor',
    },
    page_of_pentacles: {
      name: 'Hiệp Sĩ Tiền',
      meaning: {
        upright: 'Cơ hội, học hỏi, hiện thực hóa, tính thực tế, sự vững chắc',
        reversed: 'Thiếu định hướng, trì hoãn, bỏ lỡ cơ hội, thiếu thực tế',
      },
      type: 'minor',
    },
    knight_of_pentacles: {
      name: 'Hoàng Tử Tiền',
      meaning: {
        upright: 'Hiệu quả, thói quen, kiên trì, trách nhiệm, tập trung',
        reversed: 'Buồn chán, bướng bỉnh, thiếu tiến bộ, cảm thấy mắc kẹt',
      },
      type: 'minor',
    },
    queen_of_pentacles: {
      name: 'Nữ Hoàng Tiền',
      meaning: {
        upright: 'Nuôi dưỡng, thực tế, thoải mái, an toàn, hào phóng',
        reversed: 'Bỏ bê, bất an, nuông chiều bản thân, cảm thấy quá tải',
      },
      type: 'minor',
    },
    king_of_pentacles: {
      name: 'Vua Tiền',
      meaning: {
        upright: 'Thành công, tham vọng, lãnh đạo, giàu có, ổn định',
        reversed: 'Tham lam, chủ nghĩa vật chất, chiếm hữu, thiếu tầm nhìn',
      },
      type: 'minor',
    },
    ace_of_wands: {
      name: 'Át Gậy',
      meaning: {
        upright: 'Cảm hứng, tiềm năng, khởi đầu mới, sáng tạo, năng lượng',
        reversed: 'Thiếu năng lượng, trì hoãn, thiếu đam mê, tắc nghẽn sáng tạo',
      },
      type: 'minor',
    },
    two_of_wands: {
      name: 'Hai Gậy',
      meaning: {
        upright: 'Lập kế hoạch, tiến bộ, quyết định, khám phá, tầm nhìn tương lai',
        reversed: 'Thiếu định hướng, sợ thay đổi, trì hoãn, cảm thấy mắc kẹt',
      },
      type: 'minor',
    },
    three_of_wands: {
      name: 'Ba Gậy',
      meaning: {
        upright: 'Mở rộng, tầm nhìn xa, du lịch, khám phá, tiến bộ',
        reversed: 'Trở ngại, chậm trễ, thiếu kế hoạch, thất vọng',
      },
      type: 'minor',
    },
    four_of_wands: {
      name: 'Bốn Gậy',
      meaning: {
        upright: 'Lễ kỷ niệm, hài hòa, ổn định, nhà cửa, cộng đồng',
        reversed: 'Thiếu hài hòa, bất ổn, cảm thấy không được chào đón, chuyển đổi',
      },
      type: 'minor',
    },
    five_of_wands: {
      name: 'Năm Gậy',
      meaning: {
        upright: 'Xung đột, cạnh tranh, bất đồng, thử thách, sự đa dạng',
        reversed: 'Tránh xung đột, giải quyết, hài hòa, thiếu quyết đoán',
      },
      type: 'minor',
    },
    six_of_wands: {
      name: 'Sáu Gậy',
      meaning: {
        upright: 'Chiến thắng, sự công nhận, tự tin, được công nhận trước công chúng, tiến bộ',
        reversed: 'Thiếu sự công nhận, thất bại, nghi ngờ bản thân, cảm thấy không được chú ý',
      },
      type: 'minor',
    },
    seven_of_wands: {
      name: 'Bảy Gậy',
      meaning: {
        upright: 'Thử thách, phòng thủ, lòng dũng cảm, bảo vệ quan điểm, cạnh tranh',
        reversed: 'Bỏ cuộc, cảm thấy quá tải, dễ bị tổn thương, thiếu quyết đoán',
      },
      type: 'minor',
    },
    eight_of_wands: {
      name: 'Tám Gậy',
      meaning: {
        upright: 'Tốc độ, hành động, sự di chuyển, những thay đổi nhanh chóng, du lịch',
        reversed: 'Sự chậm trễ, thất vọng, thiếu động lực, chống lại sự thay đổi',
      },
      type: 'minor',
    },
    nine_of_wands: {
      name: 'Chín Gậy',
      meaning: {
        upright: 'Khả năng phục hồi, lòng dũng cảm, sự kiên trì, ranh giới, phòng thủ cuối cùng',
        reversed: 'Mệt mỏi, bỏ cuộc, dễ bị tổn thương, thiếu phòng thủ',
      },
      type: 'minor',
    },
    ten_of_wands: {
      name: 'Mười Gậy',
      meaning: {
        upright: 'Gánh nặng, trách nhiệm, căng thẳng, quá tải, làm việc chăm chỉ',
        reversed: 'Giải tỏa, ủy thác, nghỉ ngơi, cảm thấy quá tải',
      },
      type: 'minor',
    },
    page_of_wands: {
      name: 'Hiệp Sĩ Gậy',
      meaning: {
        upright: 'Cảm hứng, nhiệt huyết, ý tưởng mới, khám phá, tiềm năng',
        reversed: 'Thiếu định hướng, thiếu kiên nhẫn, tắc nghẽn sáng tạo, thiếu cam kết',
      },
      type: 'minor',
    },
    knight_of_wands: {
      name: 'Hoàng Tử Gậy',
      meaning: {
        upright: 'Phiêu lưu, đam mê, bốc đồng, năng lượng, hành động',
        reversed: 'Bốc đồng, liều lĩnh, thiếu định hướng, thất vọng',
      },
      type: 'minor',
    },
    queen_of_wands: {
      name: 'Nữ Hoàng Gậy',
      meaning: {
        upright: 'Tự tin, đam mê, độc lập, lòng dũng cảm, quyết tâm',
        reversed: 'Ghen tuông, bất an, thất thường, đòi hỏi',
      },
      type: 'minor',
    },
    king_of_wands: {
      name: 'Vua Gậy',
      meaning: {
        upright: 'Lãnh đạo, tầm nhìn, sức lôi cuốn, quyền lực, truyền cảm hứng',
        reversed: 'Độc tài, thiếu tầm nhìn, bốc đồng, tự cao',
      },
      type: 'minor',
    },
    ace_of_cups: {
      name: 'Át Cốc',
      meaning: {
        upright: 'Tình yêu, lòng trắc ẩn, cảm xúc mới, sự thức tỉnh cảm xúc, trực giác',
        reversed: 'Cảm xúc bị kìm nén, cô đơn, trống rỗng, thiếu thân mật',
      },
      type: 'minor',
    },
    two_of_cups: {
      name: 'Hai Cốc',
      meaning: {
        upright: 'Quan hệ đối tác, hài hòa, kết nối, tình yêu, cân bằng',
        reversed: 'Bất hòa, mất cân bằng, xung đột, mối quan hệ tan vỡ',
      },
      type: 'minor',
    },
    three_of_cups: {
      name: 'Ba Cốc',
      meaning: {
        upright: 'Lễ kỷ niệm, tình bạn, cộng đồng, niềm vui, sự sáng tạo',
        reversed: 'Cô lập, quá độ, thiếu sự hỗ trợ, сплетни',
      },
      type: 'minor',
    },
    four_of_cups: {
      name: 'Bốn Cốc',
      meaning: {
        upright: 'Sự thờ ơ, nội tâm, bỏ lỡ cơ hội, buồn chán, không hài lòng',
        reversed: 'Sự tham gia, chấp nhận, cơ hội mới, sự cởi mở',
      },
      type: 'minor',
    },
    five_of_cups: {
      name: 'Năm Cốc',
      meaning: {
        upright: 'Mất mát, đau buồn, hối tiếc, sầu khổ, thất vọng',
        reversed: 'Chấp nhận, bước tiếp, tha thứ, tìm thấy hy vọng',
      },
      type: 'minor',
    },
    six_of_cups: {
      name: 'Sáu Cốc',
      meaning: {
        upright: 'Hoài niệm, chia sẻ, hài hòa, ký ức tuổi thơ, sự hào phóng',
        reversed: 'Mắc kẹt trong quá khứ, ích kỷ, thiếu hào phóng, cảm thấy xa cách',
      },
      type: 'minor',
    },
    seven_of_cups: {
      name: 'Bảy Cốc',
      meaning: {
        upright: 'Lựa chọn, ảo ảnh, cơ hội, tưởng tượng, mơ mộng',
        reversed: 'Sự rõ ràng, thực tế, tập trung, đưa ra những lựa chọn rõ ràng',
      },
      type: 'minor',
    },
    eight_of_cups: {
      name: 'Tám Cốc',
      meaning: {
        upright: 'Bước đi, tìm kiếm, tách rời, bỏ lại phía sau, vỡ mộng',
        reversed: 'Ở lại, sợ thay đổi, bám víu vào quá khứ, trốn tránh',
      },
      type: 'minor',
    },
    nine_of_cups: {
      name: 'Chín Cốc',
      meaning: {
        upright: 'Ước muốn thành hiện thực, thoải mái, hạnh phúc, hài lòng, nuông chiều',
        reversed: 'Thất vọng, thiếu hài lòng, chủ nghĩa vật chất, mơ mộng hão huyền',
      },
      type: 'minor',
    },
    ten_of_cups: {
      name: 'Mười Cốc',
      meaning: {
        upright: 'Hài hòa, gia đình, trọn vẹn, niềm vui, hoàn thành cảm xúc',
        reversed: 'Bất hòa, gia đình tan vỡ, thiếu trọn vẹn, xung đột',
      },
      type: 'minor',
    },
    page_of_cups: {
      name: 'Hiệp Sĩ Cốc',
      meaning: {
        upright: 'Sự sáng tạo, trực giác, những thông điệp cảm xúc, sự tò mò, sự nhạy cảm',
        reversed: 'Sự non nớt về cảm xúc, tắc nghẽn sáng tạo, tính khí thất thường, bất an',
      },
      type: 'minor',
    },
    knight_of_cups: {
      name: 'Hoàng Tử Cốc',
      meaning: {
        upright: 'Sự lãng mạn, quyến rũ, theo đuổi cảm xúc, chủ nghĩa lý tưởng, phiêu lưu',
        reversed: 'Không thực tế, hay thay đổi, non nớt về cảm xúc, thất vọng',
      },
      type: 'minor',
    },
    queen_of_cups: {
      name: 'Nữ Hoàng Cốc',
      meaning: {
        upright: 'Lòng trắc ẩn, sự nuôi dưỡng, sự ổn định cảm xúc, trực giác, sự đồng cảm',
        reversed: 'Sự bất ổn về cảm xúc, sự cần dựa dẫm, sự thương hại bản thân, hay thao túng',
      },
      type: 'minor',
    },
    king_of_cups: {
      name: 'Vua Cốc',
      meaning: {
        upright: 'Sự trưởng thành về cảm xúc, lòng trắc ẩn, sự khéo léo, sự kiểm soát, sự cân bằng',
        reversed: 'Sự thao túng cảm xúc, tính khí thất thường, kìm nén cảm xúc, sự lạnh lùng',
      },
      type: 'minor',
    },
    ace_of_swords: {
      name: 'Át Kiếm',
      meaning: {
        upright: 'Sự thật, sự rõ ràng, ý tưởng mới, đột phá, trí tuệ',
        reversed: 'Sự nhầm lẫn, sự tàn bạo, sự bất công, thiếu rõ ràng',
      },
      type: 'minor',
    },
    two_of_swords: {
      name: 'Hai Kiếm',
      meaning: {
        upright: 'Sự do dự, sự bế tắc, sự trốn tránh, hòa hoãn, cảm xúc bị kìm nén',
        reversed: 'Sự thật được tiết lộ, giải tỏa căng thẳng, đưa ra quyết định, sự thiên vị',
      },
      type: 'minor',
    },
    three_of_swords: {
      name: 'Ba Kiếm',
      meaning: {
        upright: 'Sự đau lòng, nỗi buồn, nỗi đau, sự đau khổ, sự phản bội',
        reversed: 'Sự chữa lành, sự tha thứ, giải tỏa nỗi đau, sự lạc quan',
      },
      type: 'minor',
    },
    four_of_swords: {
      name: 'Bốn Kiếm',
      meaning: {
        upright: 'Sự nghỉ ngơi, sự thiền định, sự phục hồi, sự suy ngẫm, sự tĩnh lặng',
        reversed: 'Sự kiệt sức, sự bồn chồn, thiếu nghỉ ngơi, sự lo lắng',
      },
      type: 'minor',
    },
    five_of_swords: {
      name: 'Năm Kiếm',
      meaning: {
        upright: 'Xung đột, thất bại, sự phản bội, chiến thắng bằng mọi giá, sự hung hăng',
        reversed: 'Sự hòa giải, sự chấp nhận, sự thỏa hiệp, học hỏi từ thất bại',
      },
      type: 'minor',
    },
    six_of_swords: {
      name: 'Sáu Kiếm',
      meaning: {
        upright: 'Sự chuyển đổi, sự ra đi, sự chấp nhận, cuộc hành trình, sự trốn thoát',
        reversed: 'Mắc kẹt, chống lại sự thay đổi, những vấn đề chưa được giải quyết, cảm thấy bị mắc kẹt',
      },
      type: 'minor',
    },
    seven_of_swords: {
      name: 'Bảy Kiếm',
      meaning: {
        upright: 'Sự lừa dối, sự trộm cắp, chiến lược, sự xảo quyệt, sự lén lút',
        reversed: 'Sự thú nhận, sự trung thực, bị bắt, chịu trách nhiệm',
      },
      type: 'minor',
    },
    eight_of_swords: {
      name: 'Tám Kiếm',
      meaning: {
        upright: 'Sự hạn chế, sự bất lực, nỗi sợ hãi, cảm thấy bị mắc kẹt, sự nghi ngờ bản thân',
        reversed: 'Sự tự do, góc nhìn mới, giải phóng những giới hạn, giành lại quyền kiểm soát',
      },
      type: 'minor',
    },
    nine_of_swords: {
      name: 'Chín Kiếm',
      meaning: {
        upright: 'Sự lo lắng, sự tuyệt vọng, sự tội lỗi, sự lo lắng, sự mất ngủ',
        reversed: 'Hy vọng, sự nhẹ nhõm, đối mặt với nỗi sợ hãi, giải tỏa lo lắng',
      },
      type: 'minor',
    },
    ten_of_swords: {
      name: 'Mười Kiếm',
      meaning: {
        upright: 'Sự kết thúc của một chu kỳ, đáy vực, sự đầu hàng, thất bại, khủng hoảng',
        reversed: 'Chống lại sự thay đổi, hy vọng, khởi đầu mới, sự sống sót',
      },
      type: 'minor',
    },
    page_of_swords: {
      name: 'Hiệp Sĩ Kiếm',
      meaning: {
        upright: 'Sự tò mò, ý tưởng mới, giao tiếp, sự nhanh nhẹn trí tuệ, người tìm kiếm sự thật',
        reversed: ' сплетни, sự thao túng, thiếu tế nhị, những suy nghĩ hỗn loạn',
      },
      type: 'minor',
    },
    knight_of_swords: {
      name: 'Hoàng Tử Kiếm',
      meaning: {
        upright: 'Tham vọng, hành động, trí tuệ, quyết tâm, sự thẳng thắn',
        reversed: 'Sự hung hăng, sự bốc đồng, thiếu định hướng, sự liều lĩnh',
      },
      type: 'minor',
    },
    queen_of_swords: {
      name: 'Nữ Hoàng Kiếm',
      meaning: {
        upright: 'Trí tuệ, sự độc lập, sự rõ ràng, tính khách quan, giao tiếp trực tiếp',
        reversed: 'Sự cay đắng, sự thao túng, sự khắc nghiệt, sự thờ ơ về cảm xúc',
      },
      type: 'minor',
    },
    king_of_swords: {
      name: 'Vua Kiếm',
      meaning: {
        upright: 'Quyền lực, logic, sự thật, công lý, sức mạnh trí tuệ',
        reversed: 'Sự độc tài, sự thao túng, sự tàn ác, thiếu sự đồng cảm',
      },
      type: 'minor',
    },
  }

module.exports = { data };