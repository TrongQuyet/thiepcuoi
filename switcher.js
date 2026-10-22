// Nút "Đổi thiệp": chuyển sang thiệp khác, giữ nguyên tên khách / bên mời / giờ trên link.
// Dùng: <script src="../switcher.js" data-card="thiep-1/" data-accent="#928362" data-position="left"></script>
// Cần config.js (WEDDING_CARDS) được nạp trước.
(function () {
  var script = document.currentScript;
  var cards = window.WEDDING_CARDS || [];
  if (!script || cards.length < 2) return;

  var root = new URL('.', script.src).href;          // thư mục chứa switcher.js = thư mục gốc
  var current = script.getAttribute('data-card') || '';
  var accent = script.getAttribute('data-accent') || '#6e100f';
  var side = script.getAttribute('data-position') === 'right' ? 'right' : 'left';
  var query = location.search;

  var css = '' +
    '.tc-switch{position:fixed;bottom:18px;' + side + ':16px;z-index:2147483000;display:flex;align-items:center;gap:7px;' +
      'padding:10px 15px 10px 12px;border:0;border-radius:999px;background:' + accent + ';color:#fff;cursor:pointer;' +
      'font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 6px 18px -6px rgba(0,0,0,.45);}' +
    '.tc-switch svg{width:18px;height:18px;flex:none}' +
    '.tc-switch:focus-visible{outline:2px solid #fff;outline-offset:-5px}' +
    '.tc-backdrop{position:fixed;inset:0;z-index:2147483001;background:rgba(20,16,12,.45);opacity:0;transition:opacity .2s}' +
    '.tc-sheet{position:fixed;left:0;right:0;bottom:0;z-index:2147483002;max-width:420px;margin:0 auto;' +
      'background:#fbfaf7;color:#2b2621;border-radius:18px 18px 0 0;padding:14px 16px 20px;' +
      'font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;transform:translateY(100%);transition:transform .25s ease;' +
      'box-shadow:0 -10px 30px -10px rgba(0,0,0,.35)}' +
    '.tc-open .tc-backdrop{opacity:1}.tc-open .tc-sheet{transform:none}' +
    '.tc-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}' +
    '.tc-head h2{margin:0;font-size:17px;font-weight:600}' +
    '.tc-close{border:0;background:transparent;font-size:26px;line-height:1;padding:2px 8px;color:#6b6258;cursor:pointer}' +
    '.tc-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}' +
    '.tc-item{display:flex;align-items:center;gap:12px;padding:8px;border-radius:12px;border:1px solid #e6e0d6;' +
      'background:#fff;color:inherit;text-decoration:none}' +
    'a.tc-item:focus-visible{outline:2px solid ' + accent + ';outline-offset:2px}' +
    '.tc-item img{width:46px;height:69px;object-fit:cover;border-radius:4px;flex:none;background:#e6e0d6}' +
    '.tc-item strong{display:block;font-size:16px;font-weight:600;color:#2b2621}' +
    '.tc-item small{display:block;color:#7a7168;font-size:13px}' +
    '.tc-item.tc-current{border-color:' + accent + ';opacity:.75}' +
    '.tc-tag{margin-left:auto;font-size:12px;color:' + accent + ';white-space:nowrap}' +
    '.tc-home{justify-content:center;font-weight:600;color:' + accent + '}' +
    '@media (prefers-reduced-motion:reduce){.tc-backdrop,.tc-sheet{transition:none}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<rect x="3" y="6" width="12" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/></svg>';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tc-switch';
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.innerHTML = icon + '<span>Đổi thiệp</span>';

  var wrap = document.createElement('div');
  wrap.hidden = true;
  var backdrop = document.createElement('div');
  backdrop.className = 'tc-backdrop';
  var sheet = document.createElement('div');
  sheet.className = 'tc-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'Xem thiệp khác');

  var head = document.createElement('div');
  head.className = 'tc-head';
  var h2 = document.createElement('h2');
  h2.textContent = 'Xem thiệp khác';
  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'tc-close';
  close.setAttribute('aria-label', 'Đóng');
  close.textContent = '×';
  head.append(h2, close);

  var list = document.createElement('ul');
  list.className = 'tc-list';
  cards.forEach(function (c) {
    var li = document.createElement('li');
    var isCurrent = c.path === current;
    var item = document.createElement(isCurrent ? 'div' : 'a');
    item.className = 'tc-item' + (isCurrent ? ' tc-current' : '');
    if (!isCurrent) item.href = root + c.path + query;
    var img = document.createElement('img');
    img.src = root + c.cover;
    img.alt = '';
    img.loading = 'lazy';
    var text = document.createElement('div');
    var name = document.createElement('strong');
    name.textContent = c.name;
    var desc = document.createElement('small');
    desc.textContent = c.desc;
    text.append(name, desc);
    item.append(img, text);
    if (isCurrent) {
      var tag = document.createElement('span');
      tag.className = 'tc-tag';
      tag.textContent = 'Đang xem';
      item.appendChild(tag);
    }
    li.appendChild(item);
    list.appendChild(li);
  });
  var homeLi = document.createElement('li');
  var home = document.createElement('a');
  home.className = 'tc-item tc-home';
  home.href = root + query;
  home.textContent = 'Về trang chọn thiệp';
  homeLi.appendChild(home);
  list.appendChild(homeLi);

  sheet.append(head, list);
  wrap.append(backdrop, sheet);

  function open() {
    wrap.hidden = false;
    requestAnimationFrame(function () { wrap.classList.add('tc-open'); });
    var first = list.querySelector('a');
    if (first) first.focus({ preventScroll: true });
    document.addEventListener('keydown', onKey);
  }
  function hide() {
    wrap.classList.remove('tc-open');
    document.removeEventListener('keydown', onKey);
    setTimeout(function () { wrap.hidden = true; }, 250);
    btn.focus({ preventScroll: true });
  }
  function onKey(e) { if (e.key === 'Escape') hide(); }

  btn.addEventListener('click', function (e) { e.stopPropagation(); open(); });
  close.addEventListener('click', hide);
  backdrop.addEventListener('click', hide);

  function mount() { document.body.append(btn, wrap); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
