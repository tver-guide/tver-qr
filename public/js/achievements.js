(function () {
  var A = window.TverApp;

  function fmtDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ru-RU');
  }

  A.getState().then(function (s) {
    var real = s.achievements.filter(function (a) { return a.enabled; });
    var got = real.filter(function (a) { return a.unlocked; }).length;
    document.getElementById('counter').textContent = 'Получено ' + got + ' из ' + real.length;

    if (!s.user) {
      document.getElementById('notice').innerHTML =
        '<div class="notice">Вы не вошли в аккаунт — достижения считаются только по этому устройству. ' +
        '<a href="/auth?next=/achievements">Зарегистрируйтесь</a>, чтобы не потерять их.</div>';
    }

    document.getElementById('list').innerHTML = s.achievements.map(function (a) {
      var cls = 'ach' + (a.unlocked ? ' unlocked' : '') + (!a.enabled ? ' template' : '');
      var extra = '';
      if (!a.enabled) {
        extra = '<small>Скоро появится</small>';
      } else if (a.unlocked) {
        extra = '<small>Получено' + (a.unlockedAt ? ' ' + fmtDate(a.unlockedAt) : '') + '</small>';
      } else if (a.progress) {
        var pct = Math.round((a.progress.current / a.progress.target) * 100);
        extra = '<div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div><small>' + a.progress.current + ' / ' + a.progress.target + '</small>';
      }
      return '<div class="' + cls + '"><div class="ach-ico">' + A.esc(a.icon) + '</div>' +
        '<div><h3>' + A.esc(a.title) + '</h3><p>' + A.esc(a.description) + '</p>' + extra + '</div></div>';
    }).join('');
  }).catch(function (e) {
    document.getElementById('counter').textContent = 'Не удалось загрузить: ' + e.message;
  });
})();
