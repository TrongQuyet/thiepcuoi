// Thiệp 5 (Thước phim): nạp thông tin thiệp vào mẫu và thay meHappy bridge bằng Google Sheet (config.js).
(function () {
  var CARD = 'thiep-5';
  var API = (window.WEDDING_CONFIG && window.WEDDING_CONFIG.apiUrl) || '';
  var inv = window.weddingInvite();
  var trai = window.WEDDING_SIDES.trai;
  var p = inv.party, c = inv.ceremony;
  var dm = function (iso) { var d = iso.split('-'); return +d[2] + '/' + +d[1]; };

  // Ảnh album theo thứ tự chạy trên dải phim (tạo bởi build, kèm tỉ lệ rộng/cao)
  var ALBUM = window.T5_ALBUM || [];
  window.__T5_RATIO__ = {};
  ALBUM.forEach(function (a) { window.__T5_RATIO__[a.id] = a.ratio; });

  // Chữ cố định trong mẫu, đổi theo thiệp in
  window.__T5_TEXT__ = {
    heading: 'Tiệc cưới',
    announce: ['Trân trọng báo tin', (inv.side === 'gai' ? 'Lễ vu quy' : 'Lễ thành hôn') + ' của chúng mình'],
    heldAt: 'Tiệc chung vui được tổ chức tại',
    special: 'Và ' + (inv.guest || 'Quý khách') + ', khách mời đặc biệt',
  };

  window.__MH_PAGE__ = {
    pageId: 1,
    demo: false,
    guestParam: 'g',
    templateKey: 'thuoc-phim',
    content: {
      phimMoDau: window.T5_FILM || '',
      tieuDePhim: 'Chuyện của chúng mình',
      phuDe: 'Đám cưới là dấu mốc quan trọng nhất trong cuộc đời chúng mình.\n' +
        'Từ một lời hẹn, chúng mình bước cùng nhau vào chương mới.\n' +
        'Và chúng mình muốn ' + (inv.guest || 'Quý khách') + ' cùng xem bộ phim này.',
      loiMoiBia: 'Trân trọng kính mời Quý khách đến dự lễ cưới của',
      gioLe: p.time,
      amLich: 'Nhằm ngày ' + p.lunar,
      loiMoi: 'Trân trọng kính mời ' + (inv.guest || 'Quý khách') + ' đến dự buổi tiệc chung vui cùng gia đình chúng mình.',
      lt1Gio: p.time, lt1: 'Tiệc cưới · ' + p.weekday + ' ' + dm(p.date),
      lt2Gio: c.time, lt2: c.name + ' · ' + c.weekday + ' ' + dm(c.date),
      lt3Gio: '', lt3: '', lt4Gio: '', lt4: '',
      tenDiaDiem: p.venue,
      tenSanh: '',
      diaChi: p.address,
      linkBanDo: p.maps,
      anhDiaDiem: 'anh/dia-diem.webp',
      album: ALBUM.map(function (a) { return a.src; }).join('\n'),
      anhKetPhim: 'anh/ket-phim.webp',
      loiCamOn: 'Cảm ơn Quý khách đã dành thời gian đến chung vui trong một ngày thật ý nghĩa của cuộc đời chúng mình.\n' +
        'Mong ngày hôm ấy ngập tràn yêu thương, niềm vui và những lời chúc phúc.',
    },
    profile: {
      groom: trai.fullFirst,
      bride: trai.fullSecond,
      weddingDate: p.date,
      solarDateTime: { datetime: p.date + 'T' + p.time, dayOfWeek: p.weekday },
      location: p.venue + ', ' + p.address,
      groomParents: { father: trai.parents[0].father, mother: trai.parents[0].mother },
      brideParents: { father: trai.parents[1].father, mother: trai.parents[1].mother },
      groomBankInfo: { bankName: 'Đang cập nhật', accountHolder: 'NGUYEN TRONG QUYET', accountNumber: 'Đang cập nhật' },
      brideBankInfo: { bankName: 'Đang cập nhật', accountHolder: 'HA HOANG ANH', accountNumber: 'Đang cập nhật' },
    },
    settings: { audio: null, title: inv.first + ' & ' + inv.second, hideFooter: false, hideBrand: true },
  };

  // ---- Thay cho mh-bridge: gửi form / lời chúc về Google Sheet ----
  var guest = inv.guest ? { fullName: inv.guest } : null;
  window.__T5_GUEST__ = !!guest;

  function notReady() {
    var e = new Error('Form đang được cài đặt, Quý khách vui lòng thử lại sau.');
    e.code = 'DEMO';
    return Promise.reject(e);
  }
  function send(data) {
    if (!API) return notReady();
    data.card = CARD;
    data.ben = inv.side;
    data.invitee = inv.guest;
    return fetch(API, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) });
  }
  // "HH:mm dd/MM/yyyy" -> ISO để mẫu xếp lời chúc mới nhất lên trước
  function iso(time, i) {
    var m = /^(\d{2}):(\d{2}) (\d{2})\/(\d{2})\/(\d{4})$/.exec(time || '');
    if (m) return m[5] + '-' + m[4] + '-' + m[3] + 'T' + m[1] + ':' + m[2] + ':00+07:00';
    return new Date(Date.UTC(2000, 0, 1, 0, 0, i)).toISOString();
  }

  window.mhBridge = {
    __loaded: true,
    version: 3,
    ready: Promise.resolve({ guest: guest }),
    get guest() { return guest; },
    getGuest: function () { return Promise.resolve(guest); },
    submitRsvp: function (n) {
      return send({
        type: 'rsvp',
        name: n.fullName || '',
        attend: n.willCome ? 'Có, tôi sẽ đến' : 'Tiếc quá, tôi bận',
        guests: n.willCome && n.numberOfPeople ? String(n.numberOfPeople) : '',
        message: [n.companions, n.additionalNote].filter(Boolean).join(' · '),
      });
    },
    submitWish: function (n) {
      return send({ type: 'wish', name: n.guestName || '', message: n.message || '' }).then(function () {
        return { id: Date.now(), guestName: n.guestName, message: n.message, createdAt: new Date().toISOString() };
      });
    },
    listWishes: function () {
      if (!API) return Promise.resolve([]);
      return fetch(API).then(function (r) { return r.json(); }).then(function (list) {
        return (list || []).map(function (w, i) {
          return { id: i + 1, guestName: w.name, message: w.message, createdAt: iso(w.time, i) };
        });
      });
    },
    trackView: function () {},
    on: function () { return function () {}; },
  };
})();
