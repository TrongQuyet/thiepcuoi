// Hỏi nhanh "có đến không": tự hiện khi khách cuộn tới album ảnh hoặc sau 5 giây trong thiệp.
// Bấm Có/Không là gửi luôn lên Google Sheet với tên khách trong link (?tenkhach=).
// Link chung (không có tên) thì hiện ô điền tên và mở bàn phím ngay.
// Dùng (sau config.js): <script src="../rsvp-prompt.js" data-album="#album-grid" data-accent="#C79A4E"
//   data-bg="#10261C" data-ink="#E5E4D0"></script>
// Thiệp gọi window.RsvpPrompt.done() khi khách đã gửi form xác nhận đầy đủ để không hỏi lại.
(function () {
  var script = document.currentScript;
  function attr(name, fallback) { return (script && script.getAttribute('data-' + name)) || fallback; }
  var API = (window.WEDDING_CONFIG && window.WEDDING_CONFIG.apiUrl) || '';
  var inv = window.weddingInvite ? window.weddingInvite() : { guest: '', side: 'trai', party: {} };
  var accent = attr('accent', '#8a6a3a'), bg = attr('bg', '#fffdf8'), ink = attr('ink', '#2b2621');
  var font = attr('font', '"Times New Roman", Times, serif');
  var DELAY_MS = 5000, DONE_KEY = 'wedding-rsvp-sent', LATER_KEY = 'wedding-rsvp-later';
  var card = (location.pathname.match(/thiep-\d+/) || [''])[0];
  var ATTEND = { yes: 'Sẽ đến', no: 'Không đến được' };
  var dialog, choice = null, shown = false, timer = null, observer = null, sending = false;

  function stored(storage, key) { try { return storage.getItem(key); } catch (e) { return null; } }
  function store(storage, key, value) { try { storage.setItem(key, value); } catch (e) {} }

  function done() {
    store(localStorage, DONE_KEY, '1');
    stop();
  }
  window.RsvpPrompt = { done: done };

  if (!API || stored(localStorage, DONE_KEY) || stored(sessionStorage, LATER_KEY)) return;

  var css = '' +
    '.rp{position:fixed;inset:0;margin:auto;width:min(360px,calc(100vw - 32px));height:fit-content;max-height:calc(100dvh - 32px);overflow:auto;' +
      'box-sizing:border-box;padding:26px 22px 22px;border:1px solid ' + accent + '66;border-radius:18px;background:' + bg + ';color:' + ink + ';' +
      'box-shadow:0 24px 60px -12px rgba(0,0,0,.45);font:16px/1.5 ' + font + ';text-align:center}' +
    '.rp[open]{animation:rp-in .35s cubic-bezier(.22,1,.36,1)}' +
    '.rp::backdrop{background:rgba(0,0,0,.5)}' +
    '@keyframes rp-in{from{opacity:0;transform:translateY(14px) scale(.97)}}' +
    '.rp *{box-sizing:border-box}' +
    '.rp-x{position:absolute;top:8px;right:8px;width:36px;height:36px;border:0;border-radius:50%;background:transparent;color:inherit;opacity:.6;font-size:24px;line-height:1;cursor:pointer}' +
    '.rp-icon{font-size:30px;line-height:1}' +
    '.rp-title{margin:8px 0 4px;font-family:' + font + ';text-transform:none;font-size:21px;font-weight:700;color:' + accent + ';letter-spacing:.02em}' +
    '.rp-guest{margin:0 0 6px;font-size:16px}' +
    '.rp-guest b{font-size:19px;color:' + accent + '}' +
    '.rp-q{margin:0 0 6px;font-size:17px}' +
    '.rp-when{margin:0 0 18px;font-size:15px;opacity:.8}' +
    '.rp-actions{display:grid;gap:10px}' +
    '.rp-btn{width:100%;padding:13px 16px;border-radius:999px;border:1.5px solid ' + accent + ';font:700 16px/1.2 ' + font + ';cursor:pointer;' +
      'background:transparent;color:inherit;transition:transform .15s,opacity .2s}' +
    '.rp-btn:active{transform:scale(.98)}' +
    '.rp-btn.rp-main{background:' + accent + ';color:#fff}' +
    '.rp-btn[aria-pressed=true]{box-shadow:0 0 0 3px ' + accent + '55}' +
    '.rp-btn:disabled{opacity:.6;cursor:wait}' +
    '.rp-btn:focus-visible,.rp-x:focus-visible{outline:2px solid ' + accent + ';outline-offset:2px}' +
    '.rp-name{display:grid;gap:10px;margin-top:16px;text-align:left}' +
    '.rp-name[hidden],.rp-actions[hidden],.rp-done[hidden],.rp-err[hidden]{display:none}' +
    '.rp-name label{font-size:16px;font-weight:700}' +
    '.rp-name input{width:100%;padding:12px 14px;border:1.5px solid ' + accent + '99;border-radius:12px;background:rgba(255,255,255,.08);color:inherit;font:16px/1.3 ' + font + '}' +
    '.rp-name input:focus{outline:2px solid ' + accent + ';outline-offset:1px}' +
    '.rp-err{margin:0;color:#d9534f;font-size:15px;text-align:center}' +
    '.rp-done p{margin:6px 0 0;font-size:17px}' +
    '.rp-done .rp-title{font-size:23px}' +
    '@media (prefers-reduced-motion: reduce){.rp[open]{animation:none}}';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function whenText() {
    var p = inv.party || {};
    if (!p.date) return '';
    var d = p.date.split('-');
    return 'Tiệc cưới ' + p.time + ' · ' + p.weekday + ' ' + d[2] + '/' + d[1] + '/' + d[0] + (p.venueShort ? ' · ' + p.venueShort : '');
  }

  function build() {
    var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    dialog = el('dialog', 'rp'); dialog.setAttribute('aria-labelledby', 'rp-title');
    var close = el('button', 'rp-x', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Để sau');
    close.addEventListener('click', later);
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); later(); });

    var ask = el('div', 'rp-ask');
    var title = el('h2', 'rp-title', 'Xác nhận tham dự'); title.id = 'rp-title';
    ask.append(el('div', 'rp-icon', '💌'), title);
    if (inv.guest) {
      var g = el('p', 'rp-guest', 'Kính gửi '); g.appendChild(el('b', '', inv.guest)); ask.appendChild(g);
    }
    ask.appendChild(el('p', 'rp-q', 'Quý khách sẽ đến chung vui cùng gia đình chúng tôi chứ?'));
    if (whenText()) ask.appendChild(el('p', 'rp-when', whenText()));

    var actions = el('div', 'rp-actions');
    var yes = el('button', 'rp-btn rp-main', 'Có, tôi sẽ đến'); yes.type = 'button'; yes.setAttribute('data-a', 'yes');
    var no = el('button', 'rp-btn', 'Rất tiếc, không đến được'); no.type = 'button'; no.setAttribute('data-a', 'no');
    actions.append(yes, no);

    var form = el('form', 'rp-name'); form.hidden = true; form.noValidate = true;
    var label = el('label', '', 'Quý khách vui lòng cho biết tên'); label.htmlFor = 'rp-input';
    var input = el('input'); input.id = 'rp-input'; input.name = 'name'; input.type = 'text'; input.maxLength = 80;
    input.autocomplete = 'name'; input.placeholder = 'Ví dụ: Anh Nam, Gia đình chú Hải'; input.setAttribute('enterkeyhint', 'send');
    var send = el('button', 'rp-btn rp-main', 'Gửi xác nhận'); send.type = 'submit';
    var err = el('p', 'rp-err'); err.hidden = true; err.setAttribute('role', 'alert');
    form.append(label, input, send, err);

    var thanks = el('div', 'rp-done'); thanks.hidden = true; thanks.setAttribute('role', 'status');

    [yes, no].forEach(function (b) {
      b.addEventListener('click', function () {
        if (sending) return;
        choice = b.getAttribute('data-a');
        yes.setAttribute('aria-pressed', choice === 'yes'); no.setAttribute('aria-pressed', choice === 'no');
        if (inv.guest) { submit(inv.guest); return; }
        // Link chung: hiện ô tên và focus ngay trong lúc bấm để điện thoại mở bàn phím
        form.hidden = false;
        input.focus();
        input.scrollIntoView({ block: 'center' });
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = input.value.trim();
      err.hidden = !!name;
      err.textContent = name ? '' : 'Quý khách vui lòng điền tên.';
      if (!name) { input.focus(); return; }
      submit(name);
    });

    function busyUi(on) {
      sending = on;
      [yes, no, send].forEach(function (b) { b.disabled = on; });
      send.textContent = on ? 'Đang gửi…' : 'Gửi xác nhận';
    }

    function submit(name) {
      busyUi(true);
      err.hidden = true;
      fetch(API, {
        method: 'POST', mode: 'no-cors',
        body: new URLSearchParams({ type: 'rsvp', name: name, attend: ATTEND[choice], guests: '', message: '', invitee: inv.guest, card: card, ben: inv.side }),
      }).then(function () {
        done();
        ask.hidden = true; actions.hidden = true; form.hidden = true;
        thanks.innerHTML = '';
        thanks.append(el('div', 'rp-icon', choice === 'yes' ? '💐' : '💌'), el('h2', 'rp-title', 'Cảm ơn ' + name + '!'),
          el('p', '', choice === 'yes' ? 'Hẹn gặp quý khách trong ngày vui của chúng tôi.' : 'Cảm ơn quý khách đã báo cho chúng tôi. Mong sớm gặp lại!'));
        thanks.hidden = false;
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        setTimeout(function () { if (dialog.open) dialog.close(); }, 3200);
      }).catch(function () {
        err.hidden = false;
        err.textContent = 'Gửi chưa thành công, quý khách vui lòng thử lại.';
        if (!inv.guest) form.hidden = false;
        else form.parentNode.insertBefore(err, thanks);
      }).then(function () { busyUi(false); });
    }

    dialog.append(close, ask, actions, form, thanks);
    document.body.appendChild(dialog);
  }

  // Để sau: không hỏi lại trong lần xem này
  function later() {
    store(sessionStorage, LATER_KEY, '1');
    if (dialog && dialog.open) dialog.close();
  }

  // Không chen vào lúc khách đang mở hộp thoại khác hoặc còn ở màn mở thiệp
  function busy() {
    if (document.querySelector('dialog[open], .tc-open')) return true;
    var intro = document.getElementById('intro');
    return !!(intro && getComputedStyle(intro).display !== 'none' && intro.offsetParent !== null);
  }

  function show() {
    if (shown || stored(localStorage, DONE_KEY)) return;
    if (busy() || document.hidden) { clearTimeout(timer); timer = setTimeout(show, 1500); return; }
    shown = true;
    stop();
    build();
    dialog.showModal();
    // Không tự focus nút nào để bàn phím/viền focus không bật lên khi khách chưa chạm
    if (document.activeElement && document.activeElement !== document.body && dialog.contains(document.activeElement)) document.activeElement.blur();
  }

  function stop() {
    clearTimeout(timer);
    if (observer) { observer.disconnect(); observer = null; }
  }

  timer = setTimeout(show, DELAY_MS);
  var albumSelector = attr('album', '');
  var album = albumSelector && document.querySelector(albumSelector);
  if (album && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) show();
    }, { threshold: 0.2 });
    observer.observe(album);
  }
})();
