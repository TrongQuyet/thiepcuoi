// Thiệp 8: chữ điền vào mẫu theo bên mời / giờ / khách (dùng cả khi build lẫn trên trang).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.T8Text = factory;
})(this, function (inv) {
  var p = inv.party, c = inv.ceremony;
  function parts(d) { var x = d.split('-'); return { y: x[0], m: x[1], d: x[2] }; }
  function dm(d) { var x = parts(d); return +x.d + '/' + +x.m; }
  function up(t) { return t.toUpperCase(); }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  var pd = parts(p.date), cd = parts(c.date);
  var groomFirst = inv.side !== 'gai';
  var T = {
    role1: groomFirst ? 'Chú Rể' : 'Cô Dâu',
    role2: groomFirst ? 'Cô Dâu' : 'Chú Rể',
    short1: inv.first, short2: inv.second,
    'p1-father': inv.parents[0].father, 'p1-mother': inv.parents[0].mother,
    'p2-father': inv.parents[1].father, 'p2-mother': inv.parents[1].mother,
    announce: 'Hai gia đình trân trọng báo tin ' + c.name.toLowerCase() + ' của hai con chúng tôi',
    full1: inv.fullFirst, full2: inv.fullSecond,
    guest: inv.guest || 'Quý khách',
    // Khối 1: tiệc cưới, khối 2: lễ thành hôn / vu quy
    'e1-title': 'TIỆC CƯỚI ' + p.venueShort,
    'e1-time': 'VÀO LÚC ' + p.time, 'e1-weekday': up(p.weekday), 'e1-day': pd.d, 'e1-month': 'THÁNG ' + pd.m, 'e1-year': pd.y,
    'e1-lunar': '(Tức ngày ' + p.lunar + ')',
    'e2-title': up(c.name) + ' ' + cap(c.place),
    'e2-time': 'VÀO LÚC ' + c.time, 'e2-weekday': up(c.weekday), 'e2-day': cd.d, 'e2-month': 'THÁNG ' + cd.m, 'e2-year': cd.y,
    'e2-lunar': '(Tức ngày ' + c.lunar + ')',
    'p-time': p.time, 'p-weekday': up(p.weekday), 'p-day': pd.d, 'p-month': 'THÁNG ' + pd.m, 'p-year': pd.y,
    'p-lunar': '(Tức ngày ' + p.lunar + ')', 'p-welcome': p.time,
    countdown: '', 'cal-title': 'Tháng ' + +pd.m + ' / ' + pd.y,
    venue: p.venue + ', ' + p.address,
    't1-time': p.time, 't1-label': 'Tiệc cưới (' + p.weekday + ' ' + dm(p.date) + ')',
    't2-time': c.time, 't2-label': c.name + ' (' + c.weekday + ' ' + dm(c.date) + ')',
  };
  return T;
});
