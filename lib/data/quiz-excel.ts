export const QUIZ_EXCEL_OPTION_COUNT = 10;

export const QUIZ_EXCEL_HEADERS = [
  "Nội dung câu hỏi",
  "Loại câu hỏi (chọn trong danh sách)",
  "Độ khó (chọn trong danh sách)",
  "Lời giải (tùy chọn)",
  ...Array.from({ length: QUIZ_EXCEL_OPTION_COUNT }, (_, index) => `Đáp án ${index + 1}`),
  "Đáp án đúng (số thứ tự, phân cách bằng dấu phẩy)",
  "Điểm (tùy chọn, mặc định 1)",
];

export const QUIZ_EXCEL_TEMPLATE_INSTRUCTIONS = [
  ["Cột", "Cách điền"],
  ["Nội dung câu hỏi", "Bắt buộc, tối đa 10.000 ký tự."],
  ["Loại câu hỏi", "Chọn ô ở cột B để hiện mũi tên xổ xuống: single_choice, multiple_choice hoặc true_false."],
  ["Độ khó", "Chọn ô ở cột C để hiện mũi tên xổ xuống: easy, medium, hard hoặc để trống."],
  ["Lời giải", "Không bắt buộc."],
  ["Đáp án 1-10", "Điền từ 2 đến 10 phương án; để trống các cột không dùng."],
  ["Đáp án đúng", "Nhập số thứ tự cột đáp án, bắt đầu từ 1; ví dụ 2 hoặc 1,3."],
  ["Điểm", "Không bắt buộc, phải lớn hơn 0; mặc định là 1."],
  ["Lưu ý", "Không đổi tên các cột ở sheet Cau hoi. Mỗi dòng là một câu hỏi."],
  ["Giới hạn", "Tối đa 500 câu hỏi và dung lượng file 5 MB mỗi lần nhập."],
];
