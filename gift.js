// Hộp mừng cưới: điền mã QR, ngân hàng, số tài khoản từ WEDDING_GIFTS (config.js) vào thiệp.
// Dùng (sau config.js): <script src="../gift.js"></script>
// Đánh dấu trong HTML:
//   [data-gift="trai" | "gai" | "auto"]  khối của một người nhận ("auto": theo bên mời ?ben=, bên đó chưa có thì lấy bên còn lại)
//   [data-gift-who] [data-gift-name] [data-gift-bank] [data-gift-holder]  chữ
//   [data-gift-account]        số tài khoản + nút "Sao chép"; ="tap" thì chạm vào chính dòng chữ để chép
//   [data-gift-qr]             thay nội dung bằng ảnh QR; ="bg" thì đặt làm ảnh nền (khung LadiPage)
// Người nhận chưa có số tài khoản thì giữ nguyên chữ "đang cập nhật" sẵn có.
(function () {
  var script = document.currentScript;
  var root = script ? script.src.replace(/[^/]*$/, '') : '../';
  var gifts = window.WEDDING_GIFTS || {};
  var side = window.weddingInvite ? window.weddingInvite().side : 'trai';

  var css = '' +
    '[data-gift-account]:empty,[data-gift-holder]:empty{display:none}' +
    '.gift-qr-link{display:block;width:100%;height:100%;-webkit-tap-highlight-color:transparent}' +
    '.gift-qr-link img{display:block;width:100%;height:100%;object-fit:contain;border-radius:8px}' +
    '.gift-has-qr{width:168px!important;height:auto!important;aspect-ratio:640/717;padding:4px!important;border-style:solid!important;background:#fff!important}' +
    '.gift-copy{margin-left:6px;padding:2px 10px;border:1px solid currentColor;border-radius:999px;background:transparent;color:inherit;' +
      'font:600 12px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;cursor:pointer;vertical-align:middle;white-space:nowrap}' +
    '.gift-hint{display:block;margin-top:4px;font:13px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;opacity:.8}' +
    '.gift-has-qr + .gift-hint{max-width:190px;margin-left:auto;margin-right:auto;text-align:center}';

  function pick(key) {
    if (key !== 'auto') return gifts[key];
    var mine = gifts[side], other = gifts[side === 'gai' ? 'trai' : 'gai'];
    return mine && mine.account ? mine : other && other.account ? other : mine;
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

  // Chữ của khung LadiPage nằm trong .ladi-headline
  function textTarget(el) { return el.querySelector('.ladi-headline') || el; }

  function fill(box, g) {
    function each(sel, fn) { [].forEach.call(box.querySelectorAll(sel), fn); }
    each('[data-gift-who]', function (el) { textTarget(el).textContent = g.who; });
    each('[data-gift-name]', function (el) { textTarget(el).textContent = g.name; });
    if (!g.account) return;
    each('[data-gift-bank]', function (el) { textTarget(el).textContent = g.bank; });
    each('[data-gift-holder]', function (el) { textTarget(el).textContent = g.holder; });
    var digits = g.account.replace(/\s+/g, '');

    each('[data-gift-account]', function (el) {
      var target = textTarget(el);
      target.textContent = g.account;
      if (el.getAttribute('data-gift-account') === 'tap') {
        var hint = document.createElement('span'); hint.className = 'gift-hint'; hint.textContent = 'Chạm để sao chép số tài khoản';
        target.appendChild(hint);
        el.style.cursor = 'pointer';
        el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', 'Sao chép số tài khoản ' + g.account);
        var copyTap = function () {
          copyText(digits).then(function () { hint.textContent = 'Đã sao chép ✓'; }, function () { hint.textContent = 'Số tài khoản: ' + digits; });
          setTimeout(function () { hint.textContent = 'Chạm để sao chép số tài khoản'; }, 2000);
        };
        el.addEventListener('click', copyTap);
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyTap(); } });
        return;
      }
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'gift-copy'; btn.textContent = 'Sao chép';
      btn.setAttribute('aria-label', 'Sao chép số tài khoản ' + g.account);
      btn.addEventListener('click', function () {
        copyText(digits).then(function () { btn.textContent = 'Đã chép ✓'; }, function () { btn.textContent = 'Chưa chép được'; });
        setTimeout(function () { btn.textContent = 'Sao chép'; }, 2000);
      });
      target.appendChild(btn);
    });

    if (!g.qr) return;
    var url = root + g.qr;
    var alt = 'Mã QR chuyển khoản ' + g.bank + ' tới ' + g.holder;
    each('[data-gift-qr]', function (el) {
      if (el.getAttribute('data-gift-qr') === 'bg') {
        var bg = el.querySelector('.ladi-image-background') || el;
        bg.style.setProperty('background-image', 'url("' + url + '")', 'important');
        bg.style.setProperty('background-size', 'contain', 'important');
        bg.style.setProperty('background-repeat', 'no-repeat', 'important');
        bg.style.setProperty('background-position', 'center', 'important');
        el.style.cursor = 'pointer';
        el.setAttribute('role', 'link'); el.setAttribute('aria-label', alt + ' (mở ảnh để lưu)');
        el.addEventListener('click', function () { window.open(url, '_blank', 'noopener'); });
        return;
      }
      el.innerHTML = '';
      var a = document.createElement('a'); a.className = 'gift-qr-link'; a.href = url; a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', alt + ' (mở ảnh để lưu)');
      var img = document.createElement('img'); img.src = url; img.alt = alt; img.loading = 'lazy'; img.decoding = 'async';
      a.appendChild(img); el.appendChild(a);
      el.classList.add('gift-has-qr');
      var hint = document.createElement('span'); hint.className = 'gift-hint'; hint.textContent = 'Chạm mã QR để mở ảnh và lưu lại';
      el.parentNode.insertBefore(hint, el.nextSibling);
    });
  }

  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  [].forEach.call(document.querySelectorAll('[data-gift]'), function (box) {
    var g = pick(box.getAttribute('data-gift'));
    if (g) fill(box, g);
  });
})();
