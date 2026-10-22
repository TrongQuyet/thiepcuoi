/**
 * Nhận form xác nhận tham dự từ thiệp cưới và ghi vào Google Sheet.
 *
 * Cài đặt:
 *  1. Tạo Google Sheet mới -> Tiện ích mở rộng (Extensions) -> Apps Script.
 *  2. Xoá code mẫu, dán toàn bộ file này vào, bấm Lưu.
 *  3. Triển khai (Deploy) -> Tùy chọn triển khai mới (New deployment) -> loại "Ứng dụng web" (Web app):
 *       - Thực thi dưới dạng (Execute as): Tôi (Me)
 *       - Người có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 *  4. Cấp quyền khi được hỏi, rồi copy "URL ứng dụng web" (kết thúc bằng /exec).
 */

const SHEET_NAME = 'Xác nhận tham dự';
const HEADERS = ['Thời gian', 'Tên khách', 'Lời chúc', 'Tham dự', 'Đi cùng', 'Khách mời (theo link)'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const p = (e && e.parameter) || {};
    sheet.appendRow([
      new Date(),
      clean_(p.name),
      clean_(p.message),
      clean_(p.attend),
      clean_(p.guests),
      clean_(p.invitee),
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Mở URL /exec trên trình duyệt để kiểm tra script đã chạy
function doGet() {
  return json_({ ok: true, message: 'RSVP endpoint đang hoạt động' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

// Giới hạn độ dài và chặn nội dung bị Sheet hiểu thành công thức (=, +, -, @)
function clean_(value) {
  const text = String(value || '').trim().slice(0, 1000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
