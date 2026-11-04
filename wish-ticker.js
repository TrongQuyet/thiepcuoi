// Lời chúc chạy kiểu bình luận livestream: lấy lời chúc từ Google Sheet (config.js apiUrl),
// nổi lần lượt ở góc dưới bên trái, lời mới đẩy lời cũ lên rồi mờ dần. Nền bong bóng làm mờ (blur).
// Dùng: <script src="../wish-ticker.js" data-accent="#928362"></script> (sau config.js).
// Tuỳ chọn: data-bottom="76" (khoảng cách tới đáy màn hình, px), data-side="right".
// Thiệp gọi window.WishTicker.push({ name, message }) sau khi khách gửi lời chúc để hiện ngay.
(function () {
  var script = document.currentScript;
  function attr(name, fallback) { return (script && script.getAttribute('data-' + name)) || fallback; }
  var API = (window.WEDDING_CONFIG && window.WEDDING_CONFIG.apiUrl) || '';
  var accent = attr('accent', '#8a6a3a');
  var bottom = parseInt(attr('bottom', '76'), 10);
  var side = attr('side', 'left') === 'right' ? 'right' : 'left';
  var START_MS = 3500, EVERY_MS = 3200, LIFE_MS = 13000, CYCLE_PAUSE_MS = 7000, MAX_SHOWN = 3;
  var wishes = [], queue = [], index = 0, box = null, timer = null, started = false;

  var css = '' +
    '.wt-live{position:fixed;' + side + ':12px;bottom:calc(' + bottom + 'px + env(safe-area-inset-bottom));z-index:2147482000;' +
      'width:min(290px,calc(100vw - 96px));display:flex;flex-direction:column;justify-content:flex-end;gap:6px;pointer-events:none}' +
    '.wt-item{display:flex;align-items:flex-start;gap:8px;max-height:0;opacity:0;transform:translateY(14px);overflow:hidden;' +
      'transition:max-height .45s ease,opacity .45s ease,transform .45s cubic-bezier(.22,1,.36,1)}' +
    '.wt-item.wt-in{max-height:120px;opacity:1;transform:none}' +
    '.wt-item.wt-out{opacity:0;transform:translateY(-8px)}' +
    '.wt-avatar{flex:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:2px;' +
      'background:' + accent + ';color:#fff;font:700 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 0 0 2px rgba(255,255,255,.55)}' +
    '.wt-bubble{min-width:0;padding:6px 12px 7px;border-radius:16px;color:#fff;' +
      'background:rgba(18,14,10,.46);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);' +
      'box-shadow:0 4px 14px -6px rgba(0,0,0,.35);text-shadow:0 1px 2px rgba(0,0,0,.35);' +
      'font:14.5px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.wt-name{display:block;font-weight:700;font-size:13px;opacity:.92;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.wt-msg{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}' +
    // Lời cũ nhất (trên cùng) nhạt bớt: chỉ đổi màu chữ, không dùng opacity/mask (làm mất nền blur)
    '.wt-item:nth-last-child(n+3) .wt-bubble{color:rgba(255,255,255,.7)}' +
    '.wt-item:nth-last-child(n+3) .wt-avatar{opacity:.6}' +
    '.wt-item.wt-new .wt-bubble{background:rgba(18,14,10,.5);box-shadow:0 0 0 1.5px ' + accent + ',0 4px 14px -6px rgba(0,0,0,.35)}' +
    '@media (prefers-reduced-motion: reduce){.wt-item{transform:none!important;transition:opacity .3s}}';

  // Không chen vào lúc đang mở hộp thoại hoặc còn ở màn mở thiệp
  function busy() {
    if (document.querySelector('dialog[open], .tc-open')) return true;
    var intro = document.getElementById('intro');
    return !!(intro && getComputedStyle(intro).display !== 'none' && intro.offsetParent !== null);
  }

  function initial(name) {
    // Chữ cái đầu của từ cuối có chữ cái ("Hội bạn cấp 3" -> C)
    var words = String(name || '').trim().split(/\s+/).filter(function (x) { return /\p{L}/u.test(x); });
    return words.length ? words[words.length - 1].charAt(0).toUpperCase() : '♥';
  }

  function remove(item) {
    if (!item.parentNode || item.classList.contains('wt-out')) return;
    item.classList.add('wt-out');
    setTimeout(function () { if (item.parentNode) item.parentNode.removeChild(item); }, 450);
  }

  function show(w, isNew) {
    if (!box) {
      var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
      box = document.createElement('div'); box.className = 'wt-live'; box.setAttribute('aria-live', 'polite');
      box.setAttribute('aria-label', 'Lời chúc của khách mời');
      document.body.appendChild(box);
    }
    var item = document.createElement('div'); item.className = 'wt-item' + (isNew ? ' wt-new' : '');
    item.__wish = w;
    var avatar = document.createElement('div'); avatar.className = 'wt-avatar'; avatar.textContent = initial(w.name); avatar.setAttribute('aria-hidden', 'true');
    var bubble = document.createElement('div'); bubble.className = 'wt-bubble';
    var name = document.createElement('span'); name.className = 'wt-name'; name.textContent = w.name || 'Khách mời';
    var msg = document.createElement('span'); msg.className = 'wt-msg'; msg.textContent = w.message || '';
    bubble.append(name, msg); item.append(avatar, bubble);
    box.appendChild(item);
    requestAnimationFrame(function () { requestAnimationFrame(function () { item.classList.add('wt-in'); }); });
    // Giữ tối đa MAX_SHOWN lời trên màn hình, lời cũ nhất mờ đi trước
    var live = [].filter.call(box.children, function (c) { return !c.classList.contains('wt-out'); });
    for (var i = 0; i < live.length - MAX_SHOWN; i++) remove(live[i]);
    setTimeout(function () { remove(item); }, LIFE_MS);
  }

  function onScreen(w) {
    return !!box && [].some.call(box.children, function (c) { return c.__wish === w && !c.classList.contains('wt-out'); });
  }

  function next() {
    if (busy() || document.hidden) { timer = setTimeout(next, 1500); return; }
    if (queue.length) { show(queue.shift(), true); timer = setTimeout(next, EVERY_MS); return; }
    if (!wishes.length) { started = false; return; }
    // Bỏ qua lời đang còn trên màn hình (ít lời chúc thì không lặp lại liền nhau)
    for (var tries = 0; tries < wishes.length; tries++) {
      var w = wishes[index % wishes.length];
      index++;
      if (onScreen(w)) continue;
      show(w);
      // Hết một vòng thì nghỉ một lúc rồi mới chạy lại từ lời mới nhất
      timer = setTimeout(next, index % wishes.length === 0 ? EVERY_MS + CYCLE_PAUSE_MS : EVERY_MS);
      return;
    }
    timer = setTimeout(next, EVERY_MS);
  }

  function start(delay) {
    if (started) return;
    started = true;
    timer = setTimeout(next, delay);
  }

  window.WishTicker = {
    // Lời chúc vừa gửi: hiện ngay và đưa vào vòng chạy
    push: function (w) {
      if (!w || !w.message) return;
      var wish = { name: w.name, message: w.message };
      wishes.unshift(wish);
      index++; // giữ nguyên vị trí đang chạy trong vòng
      queue.push(wish);
      if (!started) start(0);
      else if (!busy()) { clearTimeout(timer); next(); }
    },
  };

  if (!API) return;
  fetch(API).then(function (r) { return r.json(); }).then(function (list) {
    // Mới nhất trước
    var loaded = (list || []).filter(function (w) { return w && String(w.message || '').trim(); }).reverse();
    wishes = wishes.concat(loaded);
    if (wishes.length) start(START_MS);
  }).catch(function () {});
})();
