// Cấu hình dùng chung cho tất cả các thiệp.
window.WEDDING_CONFIG = {
  // URL web app của Google Apps Script (file google-apps-script/Code.gs), kết thúc bằng /exec.
  // Để trống thì form xác nhận và sổ lời chúc chưa gửi/nhận được dữ liệu.
  apiUrl: '',
};

// Thông tin theo thiệp in của từng bên. Link có ?ben=gai thì dùng thông tin nhà gái, mặc định nhà trai.
window.WEDDING_SIDES = {
  trai: {
    first: 'Trọng Quyết', second: 'Hoàng Anh',
    parents: [
      { label: 'Nhà trai', father: 'Nguyễn Trọng Đồng', mother: 'Vũ Thị Hiền' },
      { label: 'Nhà gái', father: 'Hà Văn Hùng', mother: 'Phạm Thị Xuyến' },
    ],
    party: {
      time: '15:30', weekday: 'Thứ Sáu', date: '2026-11-27', lunar: '19 tháng 10 năm Bính Ngọ',
      venueShort: 'Công viên Đan Hoài', venue: 'Công viên Đường Mương Đan Hoài', address: 'Xã Ô Diên, TP Hà Nội',
      maps: 'https://www.google.com/maps/search/C%C3%B4ng+vi%C3%AAn+%C4%90%C6%B0%E1%BB%9Dng+M%C6%B0%C6%A1ng+%C4%90an+Ho%C3%A0i+%C3%94+Di%C3%AAn+H%C3%A0+N%E1%BB%99i',
      mapsQuery: 'Công viên Đường Mương Đan Hoài Ô Diên Hà Nội',
    },
    ceremony: { name: 'Lễ thành hôn', time: '14:45', weekday: 'Thứ Bảy', date: '2026-11-28', place: 'tư gia nhà trai' },
  },
  gai: {
    first: 'Hoàng Anh', second: 'Trọng Quyết',
    parents: [
      { label: 'Nhà gái', father: 'Hà Văn Hùng', mother: 'Phạm Thị Xuyến' },
      { label: 'Nhà trai', father: 'Nguyễn Trọng Đồng', mother: 'Vũ Thị Hiền' },
    ],
    party: {
      time: '09:00', weekday: 'Thứ Sáu', date: '2026-11-27', lunar: '19 tháng 10 năm Bính Ngọ',
      venueShort: 'Hồ Quý', venue: 'Hồ Quý, Thôn Đoài', address: 'Xã Ô Diên, TP Hà Nội',
      maps: 'https://www.google.com/maps/search/H%E1%BB%93+Qu%C3%BD+Th%C3%B4n+%C4%90o%C3%A0i+%C3%94+Di%C3%AAn+H%C3%A0+N%E1%BB%99i',
      mapsQuery: 'Hồ Quý Thôn Đoài Ô Diên Hà Nội',
    },
    ceremony: { name: 'Lễ vu quy', time: '12:00', weekday: 'Thứ Bảy', date: '2026-11-28', place: 'tư gia nhà gái' },
  },
};

// Đọc bên mời (?ben=gai) và giờ tiệc riêng (?gio=HH:MM) từ link.
window.weddingInvite = function () {
  var params = new URLSearchParams(location.search);
  var side = params.get('ben') === 'gai' ? 'gai' : 'trai';
  var info = JSON.parse(JSON.stringify(window.WEDDING_SIDES[side]));
  var gio = (params.get('gio') || '').trim();
  var m = gio.match(/^([01]?\d|2[0-3])[:hH.]?([0-5]\d)?$/);
  if (m) info.party.time = ('0' + m[1]).slice(-2) + ':' + (m[2] || '00');
  info.side = side;
  info.guest = (params.get('tenkhach') || params.get('name') || '').trim();
  // Mốc đếm ngược: ngày + giờ tiệc theo giờ Việt Nam
  info.party.endtime = Date.parse(info.party.date + 'T' + info.party.time + ':00+07:00');
  return info;
};
