/* Общий скрипт: меню, учёт открытых страниц, уведомления о достижениях.
   Подключается и на страницах с информацией (сервер добавляет его сам), и на служебных. */
(function () {
  'use strict';
  var LS_VISITED = 'tver_visited';   // страницы, открытые на этом устройстве
  var LS_SEEN = 'tver_ach_seen';     // достижения гостя, о которых уже сообщали

  function read(key) {
    try { var v = JSON.parse(localStorage.getItem(key)); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function clearProgress() { try { localStorage.removeItem(LS_VISITED); localStorage.removeItem(LS_SEEN); } catch (e) {} }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function api(url, body) {
    var opts = { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.error || 'Ошибка запроса'); e.status = r.status; throw e; }
        return d;
      });
    });
  }

  var mePromise = null;
  function me() {
    if (!mePromise) mePromise = api('/api/auth/me').then(function (d) { return d.user; }).catch(function () { return null; });
    return mePromise;
  }
  function getState() { return api('/api/progress/state', { visited: read(LS_VISITED) }); }

  /* ---------- Меню ---------- */
  function buildMenu(user) {
    var path = location.pathname;
    function link(href, icon, label) {
      return '<a class="tq-link' + (path === href ? ' is-active' : '') + '" href="' + href + '"><span class="tq-ico">' + icon + '</span>' + label + '</a>';
    }
    var account;
    if (user) {
      account = '<div class="tq-user">Вы вошли как <b>' + esc(user.username) + '</b><small>' + esc(user.email) + '</small></div>' +
        '<p class="tq-hint">Прогресс сохраняется в вашем аккаунте.</p>' +
        '<button class="tq-link" data-tq="logout"><span class="tq-ico">↩</span>Выйти</button>';
    } else {
      var next = path === '/auth' ? '/collection' : location.pathname + location.search;
      account = '<p class="tq-hint">Зарегистрируйтесь, чтобы сохранять прогресс и не потерять найденное.</p>' +
        '<a class="tq-btn" href="/auth?next=' + encodeURIComponent(next) + '">Войти / Регистрация</a>';
    }

    var burger = document.createElement('button');
    burger.className = 'tq-burger';
    burger.setAttribute('aria-label', 'Меню');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<span></span><span></span><span></span>';

    var overlay = document.createElement('div');
    overlay.className = 'tq-overlay';

    var drawer = document.createElement('nav');
    drawer.className = 'tq-drawer';
    drawer.setAttribute('aria-label', 'Меню');
    drawer.innerHTML = '<p class="tq-title">Меню</p>' +
      link('/collection', '🗂️', 'Коллекция') +
      link('/achievements', '🏆', 'Достижения') +
      '<div class="tq-sep"></div>' + account;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    document.body.appendChild(burger);

    function setOpen(open) {
      burger.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('is-open', open);
      overlay.classList.toggle('is-open', open);
    }
    burger.addEventListener('click', function () { setOpen(!drawer.classList.contains('is-open')); });
    overlay.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    drawer.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tq="logout"]');
      if (!btn) return;
      api('/api/auth/logout', {}).then(function () { clearProgress(); location.reload(); });
    });
  }

  /* ---------- Уведомление о достижении ---------- */
  var toastQueue = [], toastBusy = false;
  function showToast(ach) { toastQueue.push(ach); if (!toastBusy) nextToast(); }
  function nextToast() {
    var ach = toastQueue.shift();
    if (!ach) { toastBusy = false; return; }
    toastBusy = true;
    var el = document.createElement('div');
    el.className = 'tq-toast';
    el.setAttribute('role', 'status');
    el.innerHTML = '<span class="tq-toast-ico">' + esc(ach.icon) + '</span><div><small>Достижение получено</small><b>' + esc(ach.title) + '</b></div>';
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('is-show'); }, 50);
    setTimeout(function () { el.classList.remove('is-show'); }, 4500);
    setTimeout(function () { el.remove(); nextToast(); }, 5000);
  }

  /* ---------- Учёт открытия страницы ---------- */
  function trackVisit(slug) {
    var local = read(LS_VISITED);
    if (local.indexOf(slug) === -1) { local.push(slug); write(LS_VISITED, local); }

    api('/api/progress/visit', { slug: slug, visited: local }).then(function (s) {
      var fresh;
      if (s.user) {
        fresh = (s.newlyUnlocked || []).map(function (id) { return s.achievements.filter(function (a) { return a.id === id; })[0]; });
      } else {
        // гость: сравниваем с тем, о чём уже сообщали на этом устройстве
        var seen = read(LS_SEEN);
        var unlocked = s.achievements.filter(function (a) { return a.unlocked; });
        fresh = unlocked.filter(function (a) { return seen.indexOf(a.id) === -1; });
        write(LS_SEEN, unlocked.map(function (a) { return a.id; }));
      }
      fresh.filter(Boolean).forEach(showToast);
    }).catch(function () { /* без сети страница всё равно работает */ });
  }

  window.TverApp = { api: api, me: me, getState: getState, readVisited: function () { return read(LS_VISITED); }, clearProgress: clearProgress, esc: esc };

  me().then(buildMenu);
  if (window.__PAGE_SLUG__) trackVisit(window.__PAGE_SLUG__);
})();
