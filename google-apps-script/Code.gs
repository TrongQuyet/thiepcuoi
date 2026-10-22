/**
 * Nhận form xác nhận tham dự + lời chúc từ các thiệp cưới và ghi vào Google Sheet.
 * Trả danh sách lời chúc (GET) cho sổ lời chúc trên thiệp.
 *
 * Cài đặt:
 *  1. Tạo Google Sheet mới -> Tiện ích mở rộng (Extensions) -> Apps Script.
 *  2. Xoá code mẫu, dán toàn bộ file này vào, bấm Lưu.
 *  3. Triển khai (Deploy) -> Tùy chọn triển khai mới (New deployment) -> loại "Ứng dụng web" (Web app):
 *       - Thực thi dưới dạng (Execute as): Tôi (Me)
 *       - Người có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 *  4. Cấp quyền khi được hỏi, rồi copy "URL ứng dụng web" (kết thúc bằng /exec)
 *     và dán vào apiUrl trong file config.js ở thư mục gốc của repo.
 *
 * Sửa code sau khi đã triển khai: Triển khai -> Quản lý triển khai -> sửa (bút chì)
 * -> Phiên bản: Phiên bản mới -> Triển khai. Làm vậy thì URL /exec giữ nguyên.
 */

const SHEET_NAME = 'Khách mời';
const HEADERS = ['Thời gian', 'Loại', 'Thiệp', 'Tên khách', 'Lời chúc', 'Tham dự', 'Số người', 'Khách mời (theo link)'];
const MAX_WISHES = 200;

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = (e && e.parameter) || {};
    getSheet_().appendRow([
      new Date(),
      p.type === 'wish' ? 'Lời chúc' : 'Xác nhận',
      clean_(p.card),
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

// Danh sách lời chúc (cũ -> mới) cho sổ lời chúc. Chỉ trả tên + lời chúc, không trả thông tin khác.
function doGet() {
  const sheet = getSheet_();
  const rows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues()
    : [];
  const wishes = rows
    .filter(r => String(r[4]).trim())
    .slice(-MAX_WISHES)
    .map(r => ({ name: unclean_(r[3]) || 'Khách mời', message: unclean_(r[4]) }));
  return json_(wishes);
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

function unclean_(value) {
  return String(value || '').replace(/^'/, '');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
