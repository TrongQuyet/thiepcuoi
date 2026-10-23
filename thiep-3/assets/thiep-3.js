// Thiệp 3 (mẫu Hoàng Kim II xanh): phần tương tác viết lại bằng JavaScript thuần.
// Cần config.js (WEDDING_CONFIG, weddingInvite) và t3-text.js được nạp trước.
(function () {
  var CARD = 'thiep-3';
  var API = (window.WEDDING_CONFIG && window.WEDDING_CONFIG.apiUrl) || '';
  var inv = window.weddingInvite();
  var p = inv.party, c = inv.ceremony;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // ---------- Nội dung theo bên mời / giờ / tên khách ----------
  function fillInfo() {
    var texts = window.T3Text.texts(inv, inv.guest);
    Object.keys(texts).forEach(function (k) {
      $$('[data-w="' + k + '"]').forEach(function (el) {
        if (window.T3Text.HTML_KEYS.indexOf(k) >= 0) el.innerHTML = texts[k]; else el.textContent = texts[k];
      });
    });
    $$('[data-w="maps-link"]').forEach(function (a) { a.href = p.maps; });
    $$('[data-w="maps-embed"]').forEach(function (f) {
      f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(p.mapsQuery) + '&output=embed';
    });
  }

  // ---------- Lịch tháng ----------
  function buildCalendar() {
    var grid = $('#cal-grid');
    if (!grid) return;
    var d = p.date.split('-'), y = +d[0], m = +d[1], day = +d[2];
    var first = (new Date(y, m - 1, 1).getDay() + 6) % 7;      // tuần bắt đầu thứ Hai
    var days = new Date(y, m, 0).getDate();
    $$('#cal-grid > *').slice(7).forEach(function (el) { el.remove(); });
    for (var i = 0; i < first; i++) grid.appendChild($('#cal-empty').firstElementChild.cloneNode(true));
    for (var k = 1; k <= days; k++) {
      var cell = $(k === day ? '#cal-heart' : '#cal-day').firstElementChild.cloneNode(true);
      var spans = cell.querySelectorAll('span');
      (spans.length ? spans[spans.length - 1] : cell).textContent = k;
      grid.appendChild(cell);
    }
  }

  // ---------- Đếm ngược ----------
  function tick() {
    var s = Math.floor(Math.max(0, p.endtime - Date.now()) / 1000);
    var v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
    v.forEach(function (n, i) { var el = $('[data-w="cd-' + i + '"]'); if (el) el.textContent = i ? pad(n) : n; });
  }

  // ---------- Hiện dần khi cuộn tới ----------
  function setupReveal() {
    var els = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('t3-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('t3-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  // ---------- Nhạc ----------
  var audio, musicBtn, playing = false;
  function showMusic(on) { playing = on; musicBtn.classList.toggle('t3-paused', !on); }
  function startMusic() { return audio.play().then(function () { showMusic(true); }).catch(function () { showMusic(false); }); }
  function setupMusic() {
    audio = $('#bg-music'); musicBtn = $('#music-btn');
    musicBtn.addEventListener('click', function () { if (playing) { audio.pause(); showMusic(false); } else startMusic(); });
  }

  // ---------- Màn mở thiệp ----------
  function setupIntro() {
    var intro = $('#intro'), main = $('#main');
    document.body.classList.add('t3-locked');
    function open() {
      startMusic();
      intro.classList.add('t3-leaving');
      main.classList.add('t3-open');
      document.body.classList.remove('t3-locked');
      setTimeout(function () { intro.style.display = 'none'; setupReveal(); }, 1400);
    }
    $('#intro-open').addEventListener('click', open);
  }

  // ---------- Hộp thoại ----------
  function openDialog(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  function closeDialog(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
  function wireDialog(d) {
    $$('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { closeDialog(d); }); });
    d.addEventListener('click', function (e) { if (e.target === d) closeDialog(d); });
  }

  // ---------- Album + xem ảnh lớn ----------
  function setupAlbum() {
    var lb = $('#lightbox'), img = $('#lightbox-img'), count = $('#lightbox-count');
    var buttons = $$('#album-grid .hk2-photo');
    var srcs = buttons.map(function (b) { return b.querySelector('img').getAttribute('src'); });
    var n = srcs.length, shown = 0;
    function show(i) {
      shown = (i + n) % n;
      img.src = srcs[shown];
      img.alt = 'Ảnh cưới ' + (shown + 1);
      count.textContent = (shown + 1) + ' / ' + n;
    }
    buttons.forEach(function (b, i) { b.addEventListener('click', function () { show(i); openDialog(lb); }); });
    $('#lightbox-prev').addEventListener('click', function () { show(shown - 1); });
    $('#lightbox-next').addEventListener('click', function () { show(shown + 1); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(shown - 1);
      if (e.key === 'ArrowRight') show(shown + 1);
    });
    var x0 = null;
    img.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    img.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(shown + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    wireDialog(lb);
  }

  function send(data) {
    data.card = CARD;
    if (!data.ben) data.ben = inv.side;
    return fetch(API, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) });
  }

  // ---------- Xác nhận tham dự ----------
  function setupRsvp() {
    var dialog = $('#rsvp-dialog'), form = $('#rsvp-form'), err = $('#rsvp-error'), submit = $('#rsvp-submit');
    wireDialog(dialog);
    if (inv.guest) form.elements.name.value = inv.guest;
    var whose = form.querySelector('[name=whose][value="' + inv.side + '"]');
    if (whose) whose.checked = true;
    function guestsVisible() {
      var a = form.querySelector('[name=attend]:checked');
      $('#rsvp-guests-field').hidden = !!a && a.value === 'Vắng mặt';
    }
    $$('[name=attend]', form).forEach(function (r) { r.addEventListener('change', guestsVisible); });
    function open(attend) {
      form.hidden = false;
      $('#rsvp-done').hidden = true;
      err.hidden = true;
      if (attend) form.querySelector('[name=attend][value="' + attend + '"]').checked = true;
      guestsVisible();
      openDialog(dialog);
    }
    var VALUES = { yes: 'Sẽ đến', maybe: 'Có thể', no: 'Vắng mặt' };
    $$('#hk2-rsvp [data-attend]').forEach(function (b) {
      b.addEventListener('click', function () { open(VALUES[b.getAttribute('data-attend')]); });
    });
    $('#rsvp-jump').addEventListener('click', function () { open(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var attend = form.querySelector('[name=attend]:checked');
      var fail = !name ? 'Bạn vui lòng điền tên.' : !attend ? 'Bạn vui lòng chọn có đến hay không.' : !API ? 'Form xác nhận đang được cài đặt, bạn vui lòng thử lại sau.' : '';
      err.hidden = !fail;
      err.textContent = fail;
      if (fail) return;
      var w = form.querySelector('[name=whose]:checked');
      submit.disabled = true;
      send({
        type: 'rsvp', name: name, attend: attend.value,
        guests: attend.value === 'Vắng mặt' ? '' : form.elements.guests.value,
        message: form.elements.message.value.trim(), invitee: inv.guest, ben: w ? w.value : inv.side,
      }).then(function () {
        form.reset();
        form.hidden = true;
        $('#rsvp-done').hidden = false;
      }).catch(function () {
        err.hidden = false;
        err.textContent = 'Gửi chưa thành công, bạn vui lòng thử lại.';
      }).then(function () { submit.disabled = false; });
    });
  }

  // ---------- Thêm vào lịch ----------
  function setupCalendarButton() {
    var start = p.date.replace(/-/g, '') + 'T' + p.time.replace(':', '') + '00';
    var endH = Math.min(+p.time.split(':')[0] + 3, 23);
    var end = p.date.replace(/-/g, '') + 'T' + pad(endH) + p.time.split(':')[1] + '00';
    var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent('Tiệc cưới ' + inv.first + ' & ' + inv.second) +
      '&dates=' + start + '/' + end + '&ctz=Asia/Ho_Chi_Minh' +
      '&location=' + encodeURIComponent(p.venue + ', ' + p.address) +
      '&details=' + encodeURIComponent('Thiệp mời: ' + location.href);
    $('#cal-btn').addEventListener('click', function () { window.open(url, '_blank', 'noopener'); });
  }

  // ---------- Sổ lưu bút ----------
  function wishItem(w) {
    var el = $('#wish-item').firstElementChild.cloneNode(true);
    var spans = el.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = w.name || 'Khách mời';
    if (spans[1]) spans[1].textContent = w.time || '';
    var msg = el.querySelector('p');
    if (msg) msg.textContent = w.message || '';
    return el;
  }
  function setupWishes() {
    var form = $('#wish-form'), list = $('#wish-list'), btn = $('#wish-submit');
    var nameEl = $('#wish-name'), msgEl = $('#wish-message');
    if (inv.guest) nameEl.value = inv.guest;
    if (API) {
      fetch(API).then(function (r) { return r.json(); }).then(function (wishes) {
        list.innerHTML = '';
        wishes.slice().reverse().forEach(function (w) { list.appendChild(wishItem(w)); });
      }).catch(function () {});
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameEl.value.trim(), message = msgEl.value.trim();
      if (!name || !message) { (name ? msgEl : nameEl).focus(); return; }
      if (!API) { alert('Sổ lưu bút đang được cài đặt, bạn vui lòng thử lại sau.'); return; }
      btn.disabled = true;
      var now = new Date();
      var item = wishItem({ name: name, message: message, time: 'đang gửi...' });
      list.insertBefore(item, list.firstChild);
      send({ type: 'wish', name: name, message: message, invitee: inv.guest }).then(function () {
        item.querySelectorAll('span')[1].textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ' ' + now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();
        msgEl.value = '';
      }).catch(function () {
        item.querySelectorAll('span')[1].textContent = 'lỗi gửi';
      }).then(function () { btn.disabled = false; });
    });
  }

  function init() {
    fillInfo();
    buildCalendar();
    tick();
    setInterval(tick, 1000);
    setupMusic();
    setupIntro();
    setupAlbum();
    setupRsvp();
    setupCalendarButton();
    setupWishes();
    var gift = $('#gift-dialog');
    wireDialog(gift);
    $('#gift-open').addEventListener('click', function () { openDialog(gift); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
