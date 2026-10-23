// Nội dung chữ của thiệp 3 theo bên mời / giờ / tên khách. Dùng chung khi dựng trang và khi chạy trên trình duyệt.
(function (root) {
  var HTML_KEYS = ['announce', 'c-title', 'c-month', 'p-month'];

  function parts(d) { var x = d.split('-'); return { y: x[0], m: x[1], d: x[2] }; }
  function title(t) { return t.replace(/(^|\s)(\S)/g, function (m, a, b) { return a + b.toUpperCase(); }); }
  function dm(d) { var x = parts(d); return +x.d + '/' + +x.m; }

  function texts(inv, guest) {
    var p = inv.party, c = inv.ceremony, pd = parts(p.date), cd = parts(c.date);
    var g = guest || 'Quý khách';
    return {
      short1: inv.first,
      short2: inv.second,
      'intro-date': +pd.d + ' tháng ' + +pd.m + ', ' + pd.y,
      'hero-date': pd.d + ' · ' + pd.m + ' · ' + pd.y,
      guest: g,
      letter: 'Thân gửi ' + g + ', chúng tôi vô cùng hạnh phúc được chia sẻ niềm vui trong ngày trọng đại này. ' +
        'Sự hiện diện của ' + (guest || 'quý khách') + ' sẽ là niềm vinh hạnh lớn lao đối với gia đình chúng tôi. Trân trọng kính mời!',
      'p1-father': inv.parents[0].father, 'p1-mother': inv.parents[0].mother, 'p1-address': inv.parents[0].address,
      'p2-father': inv.parents[1].father, 'p2-mother': inv.parents[1].mother, 'p2-address': inv.parents[1].address,
      announce: 'Trân Trọng Báo Tin<br>' + title(c.name) + ' Của Con Chúng Tôi',
      full1: inv.fullFirst,
      full2: inv.fullSecond,
      'c-title': title(c.name) + '<br>được cử hành tại',
      'c-place': title(c.place),
      'c-time': c.time,
      'c-weekday': c.weekday.toUpperCase(),
      'c-day': cd.d,
      'c-month': 'THÁNG<br>' + cd.m,
      'c-year': cd.y,
      'c-lunar': '(Tức ngày ' + c.lunar + ')',
      'p-time': p.time,
      'p-weekday': p.weekday.toUpperCase(),
      'p-day': pd.d,
      'p-month': 'THÁNG<br>' + pd.m,
      'p-year': pd.y,
      'p-lunar': '(Tức ngày ' + p.lunar + ')',
      'p-welcome': p.time,
      'cal-title': 'Tháng ' + +pd.m + ' / ' + pd.y,
      venue: p.venue + ', ' + p.address,
      't1-time': p.time,
      't1-label': 'Đón khách & tiệc chung vui (' + p.weekday + ' ' + dm(p.date) + ')',
      't2-time': c.time,
      't2-label': title(c.name) + ' (' + c.weekday + ' ' + dm(c.date) + ')',
    };
  }

  var api = { texts: texts, HTML_KEYS: HTML_KEYS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.T3Text = api;
})(this);
