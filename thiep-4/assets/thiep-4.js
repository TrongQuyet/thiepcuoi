// Thiệp 4 (mẫu Liên Hoa V2 xanh): dựng lại phần tương tác bằng JavaScript thuần.
// Cần config.js (WEDDING_CONFIG, weddingInvite) được nạp trước.
(function () {
  var CARD = 'thiep-4';
  var API = (window.WEDDING_CONFIG && window.WEDDING_CONFIG.apiUrl) || '';
  var inv = window.weddingInvite();
  var p = inv.party, c = inv.ceremony;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function set(key, text) { $$('[data-w="' + key + '"]').forEach(function (el) { el.textContent = text; }); }
  function parts(d) { var x = d.split('-'); return { y: x[0], m: x[1], d: x[2] }; }
  function dm(d) { var x = parts(d); return +x.d + '/' + +x.m; }
  function up(t) { return t.toUpperCase(); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // ---------- Thông tin theo bên mời + giờ ----------
  function fillInfo() {
    var pd = parts(p.date), cd = parts(c.date);
    set('short1', inv.first);
    set('short2', inv.second);
    set('p1-father', inv.parents[0].father);
    set('p1-mother', inv.parents[0].mother);
    set('p1-address', inv.parents[0].address);
    set('p2-father', inv.parents[1].father);
    set('p2-mother', inv.parents[1].mother);
    set('p2-address', inv.parents[1].address);
    set('announce', 'TRÂN TRỌNG BÁO TIN ' + up(c.name) + ' CỦA CON CHÚNG TÔI');
    set('full1', inv.fullFirst);
    set('full2', inv.fullSecond);
    set('c-title', up(c.name) + ' ĐƯỢC CỬ HÀNH TẠI ' + up(c.place));
    set('c-time', 'VÀO LÚC ' + c.time);
    set('c-weekday', up(c.weekday));
    set('c-day', cd.d);
    set('c-month', 'THÁNG ' + cd.m);
    set('c-year', cd.y);
    set('c-lunar', '(Tức ngày ' + c.lunar + ')');
    set('p-weekday', up(p.weekday));
    set('p-time', p.time);
    set('p-day', pd.d);
    set('p-month', 'THÁNG ' + pd.m);
    set('p-year', pd.y);
    set('p-lunar', '(Tức ngày ' + p.lunar + ')');
    set('p-welcome', p.time);
    set('venue', p.venue + ', ' + p.address);
    set('t1-time', p.time);
    set('t1-label', 'Đón khách & tiệc chung vui (' + p.weekday + ' ' + dm(p.date) + ')');
    set('t2-time', c.time);
    set('t2-label', c.name + ' (' + c.weekday + ' ' + dm(c.date) + ')');
    $$('[data-w="maps-link"]').forEach(function (a) { a.href = p.maps; });
    $$('[data-w="maps-embed"]').forEach(function (f) {
      f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(p.mapsQuery) + '&output=embed';
    });
    if (inv.guest) {
      set('guest', inv.guest);
      var line = $('#guest-line');
      if (line) line.classList.remove('hidden');
    }
    // Thêm vào lịch Google
    var start = p.date.replace(/-/g, '') + 'T' + p.time.replace(':', '') + '00';
    var endH = +p.time.split(':')[0] + 3;
    var end = p.date.replace(/-/g, '') + 'T' + pad(Math.min(endH, 23)) + p.time.split(':')[1] + '00';
    var cal = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent('Tiệc cưới ' + inv.first + ' & ' + inv.second) +
      '&dates=' + start + '/' + end + '&ctz=Asia/Ho_Chi_Minh' +
      '&location=' + encodeURIComponent(p.venue + ', ' + p.address) +
      '&details=' + encodeURIComponent('Thiệp mời: ' + location.href);
    $$('[data-w="cal-link"]').forEach(function (a) { a.href = cal; });
  }

  // ---------- Lịch tháng ----------
  function buildCalendar() {
    var grid = $('#cal-grid');
    if (!grid) return;
    var pd = parts(p.date);
    var y = +pd.y, m = +pd.m, day = +pd.d;
    set('cal-title', 'Tháng ' + m + ' / ' + y);
    var first = (new Date(y, m - 1, 1).getDay() + 6) % 7;     // tuần bắt đầu thứ Hai
    var days = new Date(y, m, 0).getDate();
    grid.innerHTML = '';
    for (var i = 0; i < first; i++) grid.appendChild($('#cal-empty').firstElementChild.cloneNode(true));
    for (var d = 1; d <= days; d++) {
      var cell = $(d === day ? '#cal-heart' : '#cal-day').firstElementChild.cloneNode(true);
      var spans = cell.querySelectorAll('span');
      spans[spans.length - 1].textContent = d;
      grid.appendChild(cell);
    }
  }

  // ---------- Đếm ngược ----------
  function tick() {
    var left = Math.max(0, p.endtime - Date.now());
    var s = Math.floor(left / 1000);
    set('countdown', Math.floor(s / 86400) + ' ngày ' + Math.floor(s % 86400 / 3600) + ' giờ ' +
      Math.floor(s % 3600 / 60) + ' phút ' + (s % 60) + ' giây');
  }

  // ---------- Nhạc ----------
  function setupMusic() {
    var audio = $('#bg-music'), btn = $('#music-btn');
    if (!audio || !btn) return;
    var playing = false;
    function show(on) { playing = on; btn.classList.toggle('t4-paused', !on); }
    function start() { return audio.play().then(function () { show(true); stop(); }).catch(function () { show(false); }); }
    var events = ['pointerdown', 'touchend', 'click', 'keydown'];
    function onFirst(e) { if (!btn.contains(e.target) && !playing) start(); }
    function stop() { events.forEach(function (t) { document.removeEventListener(t, onFirst, true); }); }
    events.forEach(function (t) { document.addEventListener(t, onFirst, true); });
    show(false);
    start();
    btn.addEventListener('click', function () {
      if (playing) { audio.pause(); show(false); stop(); } else start();
    });
  }

  // ---------- Album 3D + xem ảnh lớn ----------
  function setupAlbum() {
    var box = $('#album-slides');
    if (!box) return;
    var slides = $$('#album-slides > [data-index]');
    var dots = $$('#album-dots > button');
    var n = slides.length, current = 0;
    var activeDot = dots[0] ? dots[0].className : '', idleDot = dots[1] ? dots[1].className : '';
    function render() {
      slides.forEach(function (el, i) {
        var k = i - current;
        if (k > n / 2) k -= n;
        if (k < -n / 2) k += n;
        var a = Math.abs(k), sign = k < 0 ? -1 : 1;
        el.style.transform = 'translateX(' + (60 * k) + '%) translateZ(' + (-150 * a) + 'px) rotateY(' + (45 * k) + 'deg) scale(' + Math.max(0.7, 1 - 0.15 * a) + ')';
        el.style.opacity = a === 0 ? 1 : a === 1 ? 0.75 : a === 2 ? 0.5 : a === 3 ? 0.3 : 0;
        el.style.zIndex = 100 - a;
        el.style.pointerEvents = a > 2 ? 'none' : '';
        void sign;
      });
      dots.forEach(function (d, i) {
        d.className = i === current ? activeDot : idleDot;
        d.setAttribute('aria-label', 'Ảnh ' + (i + 1));
      });
    }
    function go(i) { current = (i + n) % n; render(); }
    slides.forEach(function (el, i) {
      el.addEventListener('click', function () { if (i === current) openLightbox(i); else go(i); });
    });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    var prev = $('#album-prev'), next = $('#album-next');
    if (prev) prev.addEventListener('click', function () { go(current - 1); });
    if (next) next.addEventListener('click', function () { go(current + 1); });
    // vuốt trên điện thoại
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    // tự chạy chậm
    setInterval(function () { if (!document.hidden && !$('#lightbox').open) go(current + 1); }, 4500);
    render();

    // Xem ảnh lớn
    var lb = $('#lightbox'), img = $('#lightbox-img'), count = $('#lightbox-count');
    var thumbs = $$('#lightbox-thumbs > button');
    var srcs = slides.map(function (el) { return el.querySelector('img').getAttribute('src'); });
    var shown = 0;
    function showImg(i) {
      shown = (i + n) % n;
      img.src = srcs[shown];
      img.alt = 'Ảnh cưới ' + (shown + 1);
      if (count) count.textContent = (shown + 1) + ' / ' + n;
      thumbs.forEach(function (t, j) {
        t.style.outline = j === shown ? 'rgb(94, 129, 60) solid 2px' : '';
        t.style.outlineOffset = j === shown ? '2px' : '';
        if (j === shown) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
      });
    }
    function openLightbox(i) { showImg(i); if (lb.showModal) lb.showModal(); else lb.setAttribute('open', ''); }
    $('#lightbox-prev').addEventListener('click', function (e) { e.stopPropagation(); showImg(shown - 1); });
    $('#lightbox-next').addEventListener('click', function (e) { e.stopPropagation(); showImg(shown + 1); });
    thumbs.forEach(function (t, j) { t.addEventListener('click', function (e) { e.stopPropagation(); showImg(j); }); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') showImg(shown - 1);
      if (e.key === 'ArrowRight') showImg(shown + 1);
    });
    var lx = null;
    img.addEventListener('touchstart', function (e) { lx = e.touches[0].clientX; }, { passive: true });
    img.addEventListener('touchend', function (e) {
      if (lx === null) return;
      var dx = e.changedTouches[0].clientX - lx;
      if (Math.abs(dx) > 40) showImg(shown + (dx < 0 ? 1 : -1));
      lx = null;
    });
  }

  // ---------- Hộp thoại (quà mừng, xác nhận) ----------
  function openDialog(d) { if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  function closeDialog(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
  function setupDialogs() {
    var gift = $('#gift-dialog');
    $('#gift-open').addEventListener('click', function () { openDialog(gift); });
    $('#gift-close').addEventListener('click', function () { closeDialog(gift); });
    gift.addEventListener('click', function (e) { if (e.target === gift) closeDialog(gift); });

    var rsvp = $('#rsvp-dialog');
    $('#rsvp-open').addEventListener('click', function () {
      $('#rsvp-form').hidden = false;
      $('#rsvp-done').hidden = true;
      openDialog(rsvp);
    });
    $$('[data-close]', rsvp).forEach(function (b) { b.addEventListener('click', function () { closeDialog(rsvp); }); });
    rsvp.addEventListener('click', function (e) { if (e.target === rsvp) closeDialog(rsvp); });
  }

  function send(data) {
    data.card = CARD;
    if (!data.ben) data.ben = inv.side;
    return fetch(API, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) });
  }

  // ---------- Form xác nhận tham dự ----------
  function setupRsvp() {
    var form = $('#rsvp-form'), err = $('#rsvp-error'), submit = $('#rsvp-submit');
    if (inv.guest) form.elements.name.value = inv.guest;
    var whose = form.querySelector('[name=whose][value="' + inv.side + '"]');
    if (whose) whose.checked = true;
    function guestsVisible() {
      var a = form.querySelector('[name=attend]:checked');
      $('#rsvp-guests-field').hidden = !!a && a.value.indexOf('không') >= 0;
    }
    $$('[name=attend]', form).forEach(function (r) { r.addEventListener('change', guestsVisible); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var attend = form.querySelector('[name=attend]:checked');
      var fail = !name ? 'Bạn vui lòng điền tên.' : !attend ? 'Bạn vui lòng chọn có tham dự hay không.' : !API ? 'Form xác nhận đang được cài đặt, bạn vui lòng thử lại sau.' : '';
      err.hidden = !fail;
      err.textContent = fail;
      if (fail) { (name ? form.querySelector('[name=attend]') : form.elements.name).focus(); return; }
      var w = form.querySelector('[name=whose]:checked');
      submit.disabled = true;
      send({
        type: 'rsvp', name: name, attend: attend.value,
        guests: attend.value.indexOf('không') >= 0 ? '' : form.elements.guests.value,
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

  // ---------- Sổ lưu bút ----------
  var SUGGESTIONS = [
    'Chúc hai bạn trăm năm hạnh phúc, đầu bạc răng long!',
    'Chúc mừng hạnh phúc! Mong tổ ấm nhỏ luôn đầy ắp tiếng cười.',
    'Chúc cô dâu chú rể mãi yêu thương, thấu hiểu và đồng hành cùng nhau.',
    'Chúc hai bạn một đám cưới thật trọn vẹn và một cuộc sống thật bình yên.',
    'Thật vui khi được chứng kiến ngày hạnh phúc của hai bạn. Chúc mừng nhé!',
  ];
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
    $('#wish-suggest').addEventListener('click', function () {
      msgEl.value = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
      msgEl.focus();
    });
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
    setupAlbum();
    setupDialogs();
    setupRsvp();
    setupWishes();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
