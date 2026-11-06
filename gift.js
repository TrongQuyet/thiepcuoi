// Hộp mừng cưới dùng chung cho mọi thiệp: mã QR, ngân hàng, số tài khoản của chú rể và cô dâu (WEDDING_GIFTS trong config.js).
// Dùng (sau config.js): <script src="../gift.js" data-accent="#928362" data-bg="#FBF8F2" data-ink="#4A3F33"></script>
// Nút nào có thuộc tính data-gift-open sẽ mở hộp này. Người của bên mời (?ben=) đứng trước.
(function () {
  var script = document.currentScript;
  function attr(name, fallback) { return (script && script.getAttribute('data-' + name)) || fallback; }
  var root = script ? script.src.replace(/[^/]*$/, '') : '../';
  // Ảnh QR theo cùng phiên bản ?v= của gift.js để đổi ảnh là khách thấy ngay
  var version = (script && script.src.match(/\?v=\d+/) || [''])[0];
  var gifts = window.WEDDING_GIFTS || {};
  var side = window.weddingInvite ? window.weddingInvite().side : 'trai';
  var accent = attr('accent', '#8a6a3a'), bg = attr('bg', '#fffdf8'), ink = attr('ink', '#2b2621');
  var font = attr('font', '"Times New Roman", Times, serif');
  var ui = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
  var dialog;

  var css = '' +
    '.gb{position:fixed;inset:0;margin:auto;width:min(440px,calc(100vw - 40px));height:fit-content;max-height:calc(100dvh - 40px);overflow:auto;' +
      'box-sizing:border-box;padding:26px 20px 18px;border:1px solid ' + accent + '66;border-radius:18px;background:' + bg + ';color:' + ink + ';' +
      'box-shadow:0 24px 60px -12px rgba(0,0,0,.45);font:16px/1.45 ' + font + ';text-align:left}' +
    '.gb[open]{animation:gb-in .35s cubic-bezier(.22,1,.36,1)}' +
    '.gb::backdrop{background:rgba(0,0,0,.5)}' +
    '@keyframes gb-in{from{opacity:0;transform:translateY(14px) scale(.97)}}' +
    '.gb *{box-sizing:border-box}' +
    '.gb-x{position:absolute;top:8px;right:8px;width:36px;height:36px;border:0;border-radius:50%;background:transparent;color:inherit;opacity:.6;font-size:24px;line-height:1;cursor:pointer}' +
    '.gb-head{text-align:center;margin:0 18px 6px}' +
    '.gb-title{margin:0;font:700 22px/1.25 ' + font + ';color:' + accent + ';letter-spacing:.02em;text-transform:none}' +
    '.gb-sub{margin:6px 0 0;font-size:14.5px;opacity:.75;text-wrap:balance}' +
    '.gb-item{display:grid;grid-template-columns:112px minmax(0,1fr);gap:16px;align-items:center;padding:16px 0;border-top:1px solid ' + accent + '33}' +
    '.gb-item:first-of-type{border-top:0}' +
    '.gb-qr{display:block;width:112px;aspect-ratio:640/717;padding:5px;border:1px solid ' + accent + '55;border-radius:10px;background:#fff;' +
      'box-shadow:0 4px 14px -6px rgba(0,0,0,.25);-webkit-tap-highlight-color:transparent}' +
    '.gb-qr img{display:block;width:100%;height:100%;object-fit:contain;border-radius:6px}' +
    '.gb-noqr{display:grid;place-items:center;width:112px;aspect-ratio:640/717;border:1px dashed ' + accent + '77;border-radius:10px;font-size:13px;text-align:center;opacity:.7}' +
    '.gb-who{display:block;font:600 12px/1.4 ' + ui + ';letter-spacing:.14em;text-transform:uppercase;color:' + accent + '}' +
    '.gb-name{display:block;margin:2px 0 6px;font-size:18px;font-weight:700;line-height:1.3}' +
    '.gb-bank{display:block;font-size:14.5px;opacity:.8}' +
    '.gb-acc{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin-top:2px}' +
    '.gb-num{font-size:18px;letter-spacing:.03em;font-variant-numeric:tabular-nums;white-space:nowrap}' +
    '.gb-copy{padding:3px 12px;border:1px solid ' + accent + ';border-radius:999px;background:transparent;color:' + accent + ';font:600 12.5px/1.6 ' + ui + ';cursor:pointer;white-space:nowrap}' +
    '.gb-holder{display:block;margin-top:3px;font:12.5px/1.4 ' + ui + ';letter-spacing:.06em;opacity:.7}' +
    '.gb-hint{margin:4px 0 0;padding-top:12px;border-top:1px solid ' + accent + '33;font:13px/1.4 ' + ui + ';text-align:center;opacity:.7}' +
    '.gb-x:focus-visible,.gb-copy:focus-visible,.gb-qr:focus-visible{outline:2px solid ' + accent + ';outline-offset:2px}' +
    '@media (prefers-reduced-motion: reduce){.gb[open]{animation:none}}';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text; area.setAttribute('readonly', ''); area.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(area); area.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(area);
      ok ? resolve() : reject();
    });
  }

  function item(g) {
    var row = el('div', 'gb-item');
    if (g.account && g.qr) {
      var url = root + g.qr + version;
      var a = el('a', 'gb-qr'); a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', 'Mã QR chuyển khoản tới ' + g.holder + ' (mở ảnh để lưu)');
      var img = el('img'); img.src = url; img.alt = 'Mã QR ' + g.bank + ' ' + g.holder; img.decoding = 'async';
      a.appendChild(img); row.appendChild(a);
    } else {
      row.appendChild(el('div', 'gb-noqr', 'Đang cập nhật'));
    }
    var info = el('div', 'gb-info');
    info.append(el('span', 'gb-who', g.who), el('span', 'gb-name', g.name));
    if (g.account) {
      var digits = g.account.replace(/\s+/g, '');
      var acc = el('div', 'gb-acc');
      var btn = el('button', 'gb-copy', 'Sao chép'); btn.type = 'button';
      btn.setAttribute('aria-label', 'Sao chép số tài khoản ' + g.account);
      btn.addEventListener('click', function () {
        copyText(digits).then(function () { btn.textContent = 'Đã chép ✓'; }, function () { btn.textContent = 'Chưa chép được'; });
        setTimeout(function () { btn.textContent = 'Sao chép'; }, 2000);
      });
      acc.append(el('span', 'gb-num', g.account), btn);
      info.append(el('span', 'gb-bank', g.bank), acc, el('span', 'gb-holder', g.holder));
    }
    row.appendChild(info);
    return row;
  }

  function build() {
    var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    dialog = el('dialog', 'gb'); dialog.setAttribute('aria-labelledby', 'gb-title');
    var close = el('button', 'gb-x', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Đóng');
    close.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    var head = el('div', 'gb-head');
    var title = el('h2', 'gb-title', 'Hộp quà mừng'); title.id = 'gb-title';
    head.append(title, el('p', 'gb-sub', 'Cảm ơn tình cảm quý khách dành cho chúng tôi'));
    dialog.append(close, head);
    var order = side === 'gai' ? ['gai', 'trai'] : ['trai', 'gai'];
    order.forEach(function (k) { if (gifts[k]) dialog.appendChild(item(gifts[k])); });
    dialog.appendChild(el('p', 'gb-hint', 'Chạm vào mã QR để mở ảnh và lưu về máy'));
    document.body.appendChild(dialog);
  }

  function open() {
    if (!dialog) build();
    if (!dialog.open) dialog.showModal();
    if (document.activeElement && dialog.contains(document.activeElement)) document.activeElement.blur();
  }
  window.GiftBox = { open: open };

  // Bắt ở pha capture để nút của mẫu (vd. LadiPage) không mở hộp quà cũ
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-gift-open]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    open();
  }, true);
})();
