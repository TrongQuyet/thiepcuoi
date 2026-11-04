// Chữ dễ đọc hơn trên điện thoại: phóng to các chữ nhỏ (< 15px) và làm đậm nét quá mảnh.
// Dùng: <script src="../readable.js"></script> đặt cuối <body>, trước các script dựng nội dung động.
// Bỏ qua phần tử (và con của nó) có thuộc tính data-keep-size.
(function () {
  var MIN = 15, CAP = 16.5, BUTTON_CAP = 15;
  function bigger(px, cap) { return Math.max(px, Math.min(cap, Math.round((px * 1.15 + 1.5) * 2) / 2)); }

  function boost(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), seen = [], node, el;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim()) continue;
      el = node.parentElement;
      if (!el || el.__readable || el.closest('script,style,noscript,svg,[data-keep-size]')) continue;
      el.__readable = true; seen.push(el);
    }
    // Đọc hết cỡ chữ trước rồi mới ghi, để phần tử cha đổi cỡ không ảnh hưởng phép đo của phần tử con
    var plan = seen.map(function (e) {
      var cs = getComputedStyle(e);
      return [e, parseFloat(cs.fontSize), parseInt(cs.fontWeight, 10), e.closest('button, .btn, [role=button], a[class*=btn]') ? BUTTON_CAP : CAP];
    });
    plan.forEach(function (p) {
      if (p[1] && p[1] < MIN) p[0].style.setProperty('font-size', bigger(p[1], p[3]) + 'px', 'important');
      if (p[2] && p[2] < 400) p[0].style.setProperty('font-weight', '400', 'important');
    });
  }

  boost(document.body);
  window.ReadableText = { boost: boost };
})();
