// Lời chúc chạy trên màn hình: lấy lời chúc từ Google Sheet (config.js apiUrl), hiện lần lượt từng lời ở phía trên.
// Dùng: <script src="../wish-ticker.js" data-accent="#928362"></script> (sau config.js).
// Thiệp gọi window.WishTicker.push({ name, message }) sau khi khách gửi lời chúc để hiện ngay.
(function () {
  var script = document.currentScript;
  var API = (window.WEDDING_CONFIG && window.WEDDING_CONFIG.apiUrl) || '';
  var accent = (script && script.getAttribute('data-accent')) || '#8a6a3a';
  var SHOW_MS = 5200, GAP_MS = 1400, START_MS = 4000;
  var wishes = [], queue = [], index = 0, box = null, timer = null, closed = false, started = false;

  try { closed = sessionStorage.getItem('wish-ticker-closed') === '1'; } catch (e) {}

  var css = '' +
    '.wt-box{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top));z-index:2147482000;width:min(340px,calc(100vw - 32px));' +
      'transform:translateX(-50%);pointer-events:none}' +
    '.wt-card{position:relative;display:flex;gap:10px;align-items:flex-start;padding:10px 32px 10px 12px;border-radius:14px;' +
      'background:rgba(255,255,255,.93);color:#2b2621;box-shadow:0 8px 24px -8px rgba(0,0,0,.35);border-left:4px solid ' + accent + ';' +
      '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);pointer-events:auto;' +
      'font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;opacity:0;transform:translateY(-12px);transition:opacity .35s ease,transform .35s ease}' +
    '.wt-card.wt-in{opacity:1;transform:none}' +
    '.wt-icon{flex:none;font-size:20px;line-height:1.2}' +
    '.wt-body{min-width:0}' +
    '.wt-name{font-weight:700;color:' + accent + ';font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.wt-msg{margin-top:1px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}' +
    '.wt-close{position:absolute;top:4px;right:4px;width:26px;height:26px;border:0;border-radius:50%;background:transparent;color:#8a8178;' +
      'font-size:18px;line-height:1;cursor:pointer}' +
    '.wt-close:focus-visible{outline:2px solid ' + accent + '}' +
    '@media (prefers-reduced-motion: reduce){.wt-card{transition:opacity .2s;transform:none}}';

  // Không chen vào lúc đang mở hộp thoại hoặc còn ở màn mở thiệp
  function busy() {
    if (document.querySelector('dialog[open], .tc-open')) return true;
    var intro = document.getElementById('intro');
    if (intro && getComputedStyle(intro).display !== 'none' && intro.offsetParent !== null) return true;
    return false;
  }

  function show(w) {
    if (!box) {
      var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
      box = document.createElement('div'); box.className = 'wt-box'; box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    var card = document.createElement('div'); card.className = 'wt-card';
    var icon = document.createElement('div'); icon.className = 'wt-icon'; icon.textContent = '💌'; icon.setAttribute('aria-hidden', 'true');
    var body = document.createElement('div'); body.className = 'wt-body';
    var name = document.createElement('div'); name.className = 'wt-name'; name.textContent = w.name || 'Khách mời';
    var msg = document.createElement('div'); msg.className = 'wt-msg'; msg.textContent = w.message || '';
    var close = document.createElement('button'); close.type = 'button'; close.className = 'wt-close'; close.setAttribute('aria-label', 'Tắt lời chúc chạy'); close.textContent = '×';
    close.addEventListener('click', function () {
      closed = true; clearTimeout(timer); box.innerHTML = '';
      try { sessionStorage.setItem('wish-ticker-closed', '1'); } catch (e) {}
    });
    body.append(name, msg); card.append(icon, body, close);
    box.innerHTML = ''; box.appendChild(card);
    requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.add('wt-in'); }); });
    timer = setTimeout(function () {
      card.classList.remove('wt-in');
      timer = setTimeout(next, GAP_MS);
    }, SHOW_MS);
  }

  function next() {
    if (closed) return;
    if (busy() || document.hidden) { timer = setTimeout(next, 1500); return; }
    var w = queue.length ? queue.shift() : wishes.length ? wishes[index++ % wishes.length] : null;
    if (!w) { started = false; return; }
    show(w);
  }

  function start() {
    if (started || closed) return;
    started = true;
    timer = setTimeout(next, START_MS);
  }

  window.WishTicker = {
    // Lời chúc vừa gửi: hiện ngay lượt kế tiếp và đưa vào vòng chạy
    push: function (w) {
      if (!w || !w.message) return;
      wishes.unshift({ name: w.name, message: w.message });
      if (closed) return;
      clearTimeout(timer); started = true;
      if (busy()) { queue.unshift(w); timer = setTimeout(next, 1500); } else show(w);
    },
  };

  if (!API) return;
  fetch(API).then(function (r) { return r.json(); }).then(function (list) {
    // Mới nhất trước
    wishes = (list || []).filter(function (w) { return w && String(w.message || '').trim(); }).reverse().concat(wishes);
    if (wishes.length) start();
  }).catch(function () {});
})();
