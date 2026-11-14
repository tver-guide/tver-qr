(function () {
  var A = window.TverApp;
  var mode = 'login';
  var form = document.getElementById('form');
  var msg = document.getElementById('msg');
  var btn = document.getElementById('submit');
  var nameField = document.getElementById('nameField');

  // Куда вернуть после входа (только внутренние адреса)
  var next = new URLSearchParams(location.search).get('next') || '/collection';
  if (!/^\/(?!\/)/.test(next)) next = '/collection';

  A.me().then(function (user) { if (user) location.replace(next); });

  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      mode = t.dataset.mode;
      document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x === t); });
      nameField.hidden = mode !== 'register';
      form.password.autocomplete = mode === 'register' ? 'new-password' : 'current-password';
      btn.textContent = mode === 'register' ? 'Создать аккаунт' : 'Войти';
      msg.textContent = '';
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.textContent = '';
    var body = { email: form.email.value, password: form.password.value, visited: A.readVisited() };
    if (mode === 'register') body.username = form.username.value;

    btn.disabled = true;
    A.api('/api/auth/' + mode, body)
      .then(function () { location.href = next; })
      .catch(function (err) { msg.textContent = err.message; btn.disabled = false; });
  });
})();
