/* Салаш Орах — понашање сајта (без библиотека). */
(function () {
  'use strict';
  var W = window.SITE_W || 1440;
  var site = document.getElementById('site');

  /* 1. Дизајн је цртан за 1440px (рачунар) и 390px (телефон).
        Страница се скалира на ширину екрана, а на већим екранима стоји у средини. */
  function fit() {
    var z = window.innerWidth / W;
    if (W >= 1000) z = Math.min(1, z);
    site.style.zoom = z;
  }
  fit();
  window.addEventListener('resize', fit);

  function storage(kind) {
    try { return window[kind]; } catch (e) { return null; }
  }
  var ss = storage('sessionStorage');
  var ls = storage('localStorage');

  /* 2. Херо: слова ОРАХ се отварају — само при првом уласку, тек кад се фонт учита. */
  var hero = document.querySelector('header.hp');
  if (hero) {
    var seen = false;
    try { seen = ss && ss.getItem('orah-hero') === '1'; } catch (e) {}
    if (seen) {
      hero.classList.add('done');
    } else {
      var started = false;
      var finish = function () {
        ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (t) { window.removeEventListener(t, finish); });
        hero.classList.remove('run');
        hero.classList.add('done');
      };
      var go = function () {
        if (started) return;
        started = true;
        hero.classList.add('run');
        try { ss && ss.setItem('orah-hero', '1'); } catch (e) {}
        ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (t) { window.addEventListener(t, finish, { passive: true }); });
        setTimeout(finish, 5200);
      };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
      setTimeout(go, 1500);
    }
  }

  /* 3. Мени на телефону. */
  var menuBtn = document.querySelector('button[aria-controls="mob-meni"]');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('#mob-meni a')) {
        document.body.classList.remove('menu-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* 4. Колачићи. */
  try { if (ls && ls.getItem('orah-cookies') === '1') document.body.classList.add('cookies-ok'); } catch (e) {}
  Array.prototype.forEach.call(document.querySelectorAll('.cookie-btn'), function (b) {
    b.addEventListener('click', function () {
      document.body.classList.add('cookies-ok');
      try { ls && ls.setItem('orah-cookies', '1'); } catch (e) {}
    });
  });

  /* 5. Честа питања: отворено је највише једно. */
  var qs = document.querySelectorAll('.faq-q');
  Array.prototype.forEach.call(qs, function (q) {
    q.addEventListener('click', function () {
      var item = q.parentElement;
      var wasOpen = item.classList.contains('is-open');
      Array.prototype.forEach.call(qs, function (o) {
        o.parentElement.classList.remove('is-open');
        o.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('is-open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* 6. Утисци гостију: смењују се сами, кружићи и превлачење прстом. */
  var slides = document.querySelectorAll('.rv-slide');
  var dots = document.querySelectorAll('.rv-dot');
  if (slides.length) {
    var cur = 0, hold = false, timer = null, x0 = 0;
    var show = function (i) {
      cur = (i + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (s, k) {
        s.classList.toggle('on', k === cur);
        s.setAttribute('aria-hidden', k === cur ? 'false' : 'true');
      });
      Array.prototype.forEach.call(dots, function (d, k) {
        d.classList.toggle('on', k === cur);
        d.setAttribute('aria-current', k === cur ? 'true' : 'false');
      });
    };
    var start = function () {
      clearInterval(timer);
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = setInterval(function () { if (!hold) show(cur + 1); }, 7500);
    };
    Array.prototype.forEach.call(dots, function (d, k) {
      d.addEventListener('click', function () { show(k); start(); });
    });
    var box = slides[0].closest('section');
    if (box) {
      box.addEventListener('mouseenter', function () { hold = true; });
      box.addEventListener('mouseleave', function () { hold = false; });
      box.addEventListener('touchstart', function (e) { hold = true; x0 = e.touches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', function (e) {
        hold = false;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) { show(cur + (dx < 0 ? 1 : -1)); start(); }
      }, { passive: true });
    }
    start();
  }

  /* 7. Резервација: термини прате радно време; уторком не радимо.
        Последњи термин је сат пре затварања. */
  Array.prototype.forEach.call(document.querySelectorAll('form'), function (form) {
    var date = form.querySelector('input[type="date"]');
    var sel = form.querySelector('select');
    if (!date || !sel) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var now = new Date();
    date.min = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    var slots = function (d) {
      if (!d) return null;
      var day = new Date(d + 'T12:00:00').getDay();
      if (day === 2) return [];
      var last = day === 6 ? 24 * 60 : 22 * 60, out = [];
      for (var m = 6 * 60; m <= last; m += 30) out.push(pad(Math.floor(m / 60) % 24) + ':' + (m % 60 ? '30' : '00'));
      return out;
    };
    var fill = function () {
      var s = slots(date.value);
      var first = !s ? 'Прво изаберите датум' : (s.length ? 'Изаберите време' : 'Уторком не радимо');
      sel.innerHTML = '';
      var o = document.createElement('option'); o.value = ''; o.textContent = first; sel.appendChild(o);
      (s || []).forEach(function (t) { var op = document.createElement('option'); op.value = t; op.textContent = t; sel.appendChild(op); });
      form.classList.toggle('is-tue', !!s && s.length === 0);
      form.classList.remove('is-sent');
    };
    fill();
    date.addEventListener('change', fill);
    sel.addEventListener('change', function () { form.classList.remove('is-sent'); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = slots(date.value);
      if (!s || !s.length || !sel.value) return;
      // ОВДЕ повезати слање (нпр. Formspree или мејл) — види README.
      form.classList.add('is-sent');
    });
  });

  /* 8. Јеловник на телефону: трака категорија прати где се гост налази. */
  var catNav = document.getElementById('top-kategorije');
  if (catNav && window.IntersectionObserver) {
    var links = catNav.querySelectorAll('a.jump');
    var mark = function (id) {
      Array.prototype.forEach.call(links, function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('on', on);
        a.setAttribute('aria-current', on ? 'true' : 'false');
        if (on && catNav.scrollWidth > catNav.clientWidth) catNav.scrollTo({ left: Math.max(0, a.offsetLeft - 24), behavior: 'smooth' });
      });
    };
    var secs = document.querySelectorAll('main section[id]');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) mark(en.target.id); });
    }, { rootMargin: '-72px 0px -70% 0px' });
    Array.prototype.forEach.call(secs, function (s) { io.observe(s); });
  }
})();
