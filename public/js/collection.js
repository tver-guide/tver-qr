(function () {
  var A = window.TverApp;
  var grid = document.getElementById('grid');

  A.getState().then(function (s) {
    document.getElementById('counter').textContent = 'Открыто ' + s.visitedCount + ' из ' + s.total;
    document.getElementById('barFill').style.width = (s.total ? (s.visitedCount / s.total) * 100 : 0) + '%';

    if (!s.user) {
      document.getElementById('notice').innerHTML =
        '<div class="notice">Прогресс пока хранится только на этом устройстве. ' +
        '<a href="/auth?next=/collection">Зарегистрируйтесь</a>, чтобы сохранить его в аккаунте.</div>';
    }

    grid.innerHTML = s.pages.map(function (p) {
      var num = '№' + String(p.number).padStart(2, '0');
      if (p.opened) {
        return '<a class="card" href="' + A.esc(p.url) + '">' +
          '<img class="thumb" loading="lazy" alt="" src="' + A.esc(p.thumb) + '">' +
          '<div class="card-body"><span class="num">' + num + '</span><h3>' + A.esc(p.title) + '</h3><p>' + A.esc(p.summary) + '</p></div></a>';
      }
      return '<div class="card locked"><div class="thumb ph">?</div>' +
        '<div class="card-body"><span class="num">' + num + '</span><h3>Скрытый объект</h3><p>Найдите QR-код на месте, чтобы открыть</p></div></div>';
    }).join('');
  }).catch(function (e) {
    document.getElementById('counter').textContent = 'Не удалось загрузить: ' + e.message;
  });
})();
