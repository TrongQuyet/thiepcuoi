// Thiệp 7 (Phố lên đèn): nạp thông tin thiệp vào mẫu và thay meHappy bridge bằng Google Sheet (config.js).
(function () {
  var CARD = 'thiep-7';
  var API = (window.WEDDING_CONFIG && window.WEDDING_CONFIG.apiUrl) || '';
  var inv = window.weddingInvite();
  var trai = window.WEDDING_SIDES.trai;
  var p = inv.party, c = inv.ceremony;
  var dm = function (iso) { var d = iso.split('-'); return +d[2] + '/' + +d[1]; };

  // Ảnh album theo thứ tự (tạo bởi build, kèm tỉ lệ rộng/cao); ảnh đầu in to nhất
  var ALBUM = window.T7_ALBUM || [];
  window.__T7_RATIO__ = {};
  ALBUM.forEach(function (a) { window.__T7_RATIO__[a.id] = a.ratio; });

  // Chữ cố định trong mẫu, đổi theo thiệp in
  window.__T7_TEXT__ = {
    attend: 'Về dự tiệc cưới',
    announce: 'Trân trọng báo tin ' + (inv.side === 'gai' ? 'lễ vu quy' : 'lễ thành hôn') + ' của chúng mình',
  };

  window.__MH_PAGE__ = {
    pageId: 1,
    demo: false,
    guestParam: 'g',
    templateKey: 'den-long',
    content: {
      loiMoiBia: 'Trân trọng kính mời',
      loiMoi: 'Hai gia đình chúng mình trân trọng kính mời ' + (inv.guest || 'Quý khách') + ' tới dự buổi tiệc chung vui cùng gia đình.\n' +
        'Sự hiện diện của ' + (inv.guest || 'Quý khách') + ' là niềm vinh hạnh cho gia đình chúng mình.',
      // Lễ 1: tiệc cưới (khách được mời), lễ 2: lễ thành hôn / vu quy tại tư gia; lễ 3 tắt
      le1Ten: 'Tiệc cưới', le1Ngay: p.date, le1Gio: p.time, le1AmLich: 'Tức ngày ' + p.lunar,
      le1Noi: p.venue, le1DiaChi: p.address, le1BanDo: p.maps,
      le2Ten: c.name, le2Ngay: c.date, le2Gio: c.time, le2AmLich: 'Tức ngày ' + c.lunar,
      le2Noi: c.place.charAt(0).toUpperCase() + c.place.slice(1), le2DiaChi: c.address, le2BanDo: c.maps,
      le3Ten: 'Tiệc cưới', le3Ngay: p.date, le3Gio: p.time, le3AmLich: '', le3Noi: '', le3DiaChi: '', le3BanDo: '',
      _off_le3: '1',
      album: ALBUM.map(function (a) { return a.src; }).join('\n'),
      anhKetThuc: 'anh/ket-thuc.webp',
      loiCamOn: 'Cảm ơn Quý khách đã dành thời gian đến chung vui cùng gia đình chúng mình.\n' +
        'Mong ngày hôm ấy ngập tràn yêu thương và những lời chúc phúc.',
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
  window.__T7_GUEST__ = !!guest;

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
