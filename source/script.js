/* ============================================================
   for laasya — interactions
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  /* ---------------- name: split into letters ---------------- */
  var nameEl = $('.name');
  if (nameEl) {
    var nameText = nameEl.textContent.trim();
    nameEl.textContent = '';
    Array.prototype.forEach.call(nameText, function (ch, i) {
      var span = document.createElement('span');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      span.style.setProperty('--d', i);
      span.setAttribute('aria-hidden', 'true');
      nameEl.appendChild(span);
    });
    nameEl.setAttribute('aria-label', nameText);
  }

  /* ---------------- loader ---------------- */
  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    document.body.classList.add('ready');
    var loader = $('#loader');
    if (loader) {
      loader.classList.add('done');
      window.setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 900);
    }
    startTyping();
  }
  if (document.readyState === 'complete') {
    window.setTimeout(boot, 500);
  } else {
    window.addEventListener('load', function () { window.setTimeout(boot, 500); });
  }
  window.setTimeout(boot, 4200); // failsafe

  /* ---------------- cursor ---------------- */
  var dot = $('#cursorDot');
  var ring = $('#cursorRing');
  if (dot && ring && fine && !reduced) {
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my, seen = false;

    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)';
      if (!seen) {
        seen = true;
        document.body.classList.add('cursor-ready');
      }
    }, { passive: true });

    window.addEventListener('pointerover', function (e) {
      var hot = e.target && e.target.closest ? e.target.closest('a, button, .card, .envelope, .polaroid') : null;
      ring.classList.toggle('cursor-hover', !!hot);
    }, { passive: true });

    document.addEventListener('pointerleave', function () {
      document.body.classList.remove('cursor-ready');
    });

    (function cursorLoop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';
      window.requestAnimationFrame(cursorLoop);
    })();
  }

  /* ---------------- scroll progress / nav ---------------- */
  var nav = $('#nav');
  var prog = $('#progress');
  var timeline = $('.timeline');
  var timelineFill = $('#timelineFill');
  var ticking = false;

  function updateTimeline() {
    if (!timeline || !timelineFill) return;
    var r = timeline.getBoundingClientRect();
    var start = window.innerHeight * 0.66;
    var passed = clamp((start - r.top) / Math.max(1, r.height), 0, 1);
    timelineFill.style.height = (passed * 100) + '%';
  }

  function onScroll() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (prog) prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', y > 28);
    updateTimeline();
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  window.addEventListener('resize', function () {
    window.requestAnimationFrame(onScroll);
    sizeBg();
    sizeFx();
  });

  onScroll();

  /* ---------------- background canvas ---------------- */
  var bg = $('#bg');
  var bgc = bg ? bg.getContext('2d') : null;
  var W = window.innerWidth, H = window.innerHeight, DPR = 1;
  var stars = [], floaters = [], shoot = null, shootTimer = rand(4, 9);

  function heartPath(c, x, y, s, rot) {
    c.save();
    c.translate(x, y);
    if (rot) c.rotate(rot);
    c.beginPath();
    c.moveTo(0, 0.30 * s);
    c.bezierCurveTo(0, 0.10 * s, -0.50 * s, 0.10 * s, -0.50 * s, -0.15 * s);
    c.bezierCurveTo(-0.50 * s, -0.45 * s, -0.15 * s, -0.50 * s, 0, -0.25 * s);
    c.bezierCurveTo(0.15 * s, -0.50 * s, 0.50 * s, -0.45 * s, 0.50 * s, -0.15 * s);
    c.bezierCurveTo(0.50 * s, 0.10 * s, 0, 0.10 * s, 0, 0.30 * s);
    c.closePath();
    c.restore();
  }

  function sizeBg() {
    if (!bg || !bgc) return;
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    bg.width = Math.floor(W * DPR);
    bg.height = Math.floor(H * DPR);
    bg.style.width = W + 'px';
    bg.style.height = H + 'px';
    bgc.setTransform(DPR, 0, 0, DPR, 0, 0);

    var count = clamp(Math.round((W * H) / 15000), 70, 220);
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(0.4, 1.5),
        a: rand(0.18, 0.8),
        tw: rand(0.4, 1.7),
        ph: rand(0, Math.PI * 2),
        c: Math.random() > 0.82 ? '255,214,230' : '255,255,255'
      });
    }

    var heartCount = W < 700 ? 8 : 14;
    floaters = [];
    for (var j = 0; j < heartCount; j++) {
      floaters.push({
        x: rand(0, W),
        y: rand(0, H),
        s: rand(6, 18),
        vy: rand(0.12, 0.45),
        sw: rand(0.2, 0.7),
        ph: rand(0, Math.PI * 2),
        a: rand(0.06, 0.2),
        c: Math.random() > 0.5 ? '255,150,190' : '189,164,255'
      });
    }
    if (reduced) drawBg(0, true);
  }

  function drawBg(time, once) {
    if (!bgc) return;
    bgc.clearRect(0, 0, W, H);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = once ? s.a : s.a * (0.55 + 0.45 * Math.sin(time * s.tw + s.ph));
      bgc.globalAlpha = Math.max(0, a);
      bgc.fillStyle = 'rgb(' + s.c + ')';
      bgc.beginPath();
      bgc.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      bgc.fill();
    }

    for (var j = 0; j < floaters.length; j++) {
      var f = floaters[j];
      if (!once) {
        f.y -= f.vy;
        f.x += Math.sin(time * f.sw + f.ph) * 0.18;
        if (f.y < -30) { f.y = H + 30; f.x = rand(0, W); }
        if (f.x < -30) f.x = W + 30;
        if (f.x > W + 30) f.x = -30;
      }
      bgc.globalAlpha = f.a * (once ? 1 : 0.7 + 0.3 * Math.sin(time + f.ph));
      bgc.fillStyle = 'rgb(' + f.c + ')';
      heartPath(bgc, f.x, f.y, f.s, once ? 0 : Math.sin(time * 0.4 + f.ph) * 0.22);
      bgc.fill();
    }
    bgc.globalAlpha = 1;

    if (!once && !reduced) {
      if (!shoot && time > shootTimer) {
        shoot = { x: rand(W * 0.1, W * 0.7), y: rand(0, H * 0.35), vx: rand(5, 9), vy: rand(2.5, 4.5), life: 1 };
        shootTimer = time + rand(5, 11);
      }
      if (shoot) {
        shoot.x += shoot.vx;
        shoot.y += shoot.vy;
        shoot.life -= 0.012;
        if (shoot.life <= 0 || shoot.x > W + 60 || shoot.y > H + 60) {
          shoot = null;
        } else {
          var g = bgc.createLinearGradient(shoot.x, shoot.y, shoot.x - 90, shoot.y - 45);
          g.addColorStop(0, 'rgba(255,255,255,' + (0.75 * shoot.life) + ')');
          g.addColorStop(1, 'rgba(255,255,255,0)');
          bgc.strokeStyle = g;
          bgc.lineWidth = 1.4;
          bgc.beginPath();
          bgc.moveTo(shoot.x, shoot.y);
          bgc.lineTo(shoot.x - 90, shoot.y - 45);
          bgc.stroke();
        }
      }
    }
  }

  function bgLoop(t) {
    window.requestAnimationFrame(bgLoop);
    if (document.hidden) return;
    var time = t / 1000;
    if (!reduced) drawBg(time, false);
  }

  if (bgc) {
    sizeBg();
    if (reduced) drawBg(0, true);
    else window.requestAnimationFrame(bgLoop);
  }

  /* ---------------- typewriter ---------------- */
  var typedEl = $('#typed');
  var typingStarted = false;
  var phrases = [
    'you make ordinary days feel like poetry 🌸',
    'six letters, and somehow my whole world 🌍',
    'I built you an entire website. that should tell you something 😌',
    'stay till the end — there is a question waiting 💍'
  ];

  function startTyping() {
    if (typingStarted || !typedEl) return;
    typingStarted = true;

    if (reduced) {
      typedEl.textContent = phrases[0];
      return;
    }

    var p = 0, i = 0, deleting = false;
    function step() {
      var chars = Array.from(phrases[p]);
      if (!deleting) {
        i++;
        typedEl.textContent = chars.slice(0, i).join('');
        if (i === chars.length) {
          deleting = true;
          window.setTimeout(step, 2300);
          return;
        }
        window.setTimeout(step, 38 + Math.random() * 42);
      } else {
        i--;
        typedEl.textContent = chars.slice(0, i).join('');
        if (i === 0) {
          deleting = false;
          p = (p + 1) % phrases.length;
          window.setTimeout(step, 450);
          return;
        }
        window.setTimeout(step, 22);
      }
    }
    step();
  }

  /* ---------------- reveal on scroll ---------------- */
  $$('.cards').forEach(function (group) {
    $$('.reveal', group).forEach(function (el, i) {
      el.style.setProperty('--i', i);
    });
  });

  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------- tilt cards ---------------- */
  if (fine && !reduced) {
    $$('.tilt').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.classList.add('tilting');
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        card.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 9) + 'deg) rotateY(' + ((px - 0.5) * 9) + 'deg) translateY(-5px)';
      });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('tilting');
        card.style.transform = '';
      });
    });
  }

  /* ---------------- magnetic buttons ---------------- */
  if (fine && !reduced) {
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width;
        var y = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = 'translate(' + (x * 9) + 'px,' + (y * 7) + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }

  /* ---------------- hero parallax ---------------- */
  var hero = $('#hero');
  var heroInner = $('.hero__inner');
  if (hero && heroInner && fine && !reduced) {
    hero.addEventListener('pointermove', function (e) {
      var x = (e.clientX / window.innerWidth - 0.5);
      var y = (e.clientY / window.innerHeight - 0.5);
      heroInner.style.transform = 'translate3d(' + (x * 14) + 'px,' + (y * 10) + 'px,0)';
    });
    hero.addEventListener('pointerleave', function () {
      heroInner.style.transform = '';
    });
  }

  /* ---------------- envelope ---------------- */
  var envelope = $('#envelope');
  var letterCard = $('#letterCard');
  var envHint = $('#envHint');

  function openLetter() {
    if (!envelope || envelope.classList.contains('open')) return;
    envelope.classList.add('open');
    envelope.setAttribute('aria-expanded', 'true');
    if (letterCard) letterCard.classList.add('open');
    if (envHint) envHint.textContent = 'read it slowly ♥';
    window.setTimeout(function () {
      if (letterCard && letterCard.scrollIntoView) {
        letterCard.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }
    }, 520);
  }

  if (envelope) {
    envelope.addEventListener('click', openLetter);
    envelope.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        openLetter();
      }
    });
  }

  /* ---------------- confetti / firework canvas ---------------- */
  var fx = $('#fx');
  var fxc = fx ? fx.getContext('2d') : null;
  var parts = [];
  var fxW = 0, fxH = 0, fxDpr = 1, fxRunning = false;
  var palette = ['#ff6ea9', '#ffb7d1', '#bda4ff', '#ffd9a0', '#fff6fa', '#ff9ec2'];

  function sizeFx() {
    if (!fx || !fxc) return;
    fxW = window.innerWidth;
    fxH = window.innerHeight;
    fxDpr = Math.min(window.devicePixelRatio || 1, 2);
    fx.width = Math.floor(fxW * fxDpr);
    fx.height = Math.floor(fxH * fxDpr);
    fx.style.width = fxW + 'px';
    fx.style.height = fxH + 'px';
    fxc.setTransform(fxDpr, 0, 0, fxDpr, 0, 0);
  }

  function spawnBurst(x, y, n, type) {
    if (!fxc) return;
    for (var i = 0; i < n; i++) {
      var ang = rand(0, Math.PI * 2);
      var sp = rand(2, type === 'spark' ? 5 : 9.5);
      parts.push({
        x: x,
        y: y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - rand(1, 4.5),
        g: rand(0.05, 0.15),
        drag: 0.985,
        size: type === 'heart' ? rand(9, 20) : rand(4, 9),
        rot: rand(0, 6.28),
        vr: rand(-0.22, 0.22),
        c: palette[(Math.random() * palette.length) | 0],
        life: 1,
        decay: rand(0.005, 0.013),
        shape: type
      });
    }
    startFx();
  }

  function startFx() {
    if (!fxRunning) {
      fxRunning = true;
      window.requestAnimationFrame(fxLoop);
    }
  }

  function fxLoop() {
    if (!fxc) { fxRunning = false; return; }
    fxc.clearRect(0, 0, fxW, fxH);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += p.g;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= p.decay;

      if (p.life <= 0 || p.y > fxH + 80) {
        parts.splice(i, 1);
        continue;
      }

      fxc.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
      fxc.fillStyle = p.c;

      if (p.shape === 'heart') {
        heartPath(fxc, p.x, p.y, p.size, p.rot);
        fxc.fill();
      } else if (p.shape === 'spark') {
        fxc.beginPath();
        fxc.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
        fxc.fill();
      } else {
        fxc.save();
        fxc.translate(p.x, p.y);
        fxc.rotate(p.rot);
        fxc.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        fxc.restore();
      }
    }
    fxc.globalAlpha = 1;

    if (parts.length) {
      window.requestAnimationFrame(fxLoop);
    } else {
      fxRunning = false;
      fxc.clearRect(0, 0, fxW, fxH);
    }
  }

  if (fxc) {
    sizeFx();
    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('#no')) return;
      spawnBurst(e.clientX, e.clientY, 9, 'spark');
    }, { passive: true });
  }

  /* ---------------- flash + heart rain ---------------- */
  function flash() {
    var f = $('#flash');
    if (!f) return;
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  }

  function heartsRain() {
    var layer = $('#heartRain');
    if (!layer) return;
    var colors = ['#ff6ea9', '#ffb7d1', '#bda4ff', '#ffd9a0', '#fff6fa'];
    var count = window.innerWidth < 600 ? 34 : 62;
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.textContent = '♥';
      s.style.setProperty('--x', rand(0, 100).toFixed(2) + '%');
      s.style.setProperty('--s', rand(12, 34).toFixed(0) + 'px');
      s.style.setProperty('--c', colors[i % colors.length]);
      s.style.setProperty('--dur', rand(3.4, 7.5).toFixed(2) + 's');
      s.style.setProperty('--delay', rand(0, 2.4).toFixed(2) + 's');
      s.style.setProperty('--dx', rand(-90, 90).toFixed(0) + 'px');
      s.style.setProperty('--rot', rand(-240, 240).toFixed(0) + 'deg');
      layer.appendChild(s);
    }
    window.setTimeout(function () { layer.innerHTML = ''; }, 11500);
  }

  function confettiShow() {
    if (reduced) return;
    var waves = window.innerWidth < 600 ? 3 : 5;
    for (var i = 0; i < waves; i++) {
      (function (i) {
        window.setTimeout(function () {
          spawnBurst(rand(fxW * 0.15, fxW * 0.85), rand(fxH * 0.15, fxH * 0.55), 55, i % 3 === 0 ? 'heart' : 'confetti');
        }, i * 280);
      })(i);
    }
    window.setTimeout(function () {
      spawnBurst(fxW / 2, fxH * 0.4, 80, 'heart');
    }, 1000);

    var shower = window.setInterval(function () {
      spawnBurst(rand(fxW * 0.1, fxW * 0.9), rand(fxH * 0.1, fxH * 0.4), 22, 'spark');
    }, 1300);
    window.setTimeout(function () { window.clearInterval(shower); }, 7000);
  }

  /* ---------------- the question ---------------- */
  var ask = $('#ask');
  var zone = $('#zone');
  var yesBtn = $('#yes');
  var noBtn = $('#no');
  var hintEl = $('#hint');
  var saidEl = $('#said');
  var dodges = 0;
  var accepted = false;

  var noLabels = [
    'No',
    'Are you sure?',
    'Really sure?',
    'Think again 🥺',
    'Last chance...',
    'You are breaking my heart 💔',
    'I will wait forever 🥹',
    'No is not an option 😌',
    'Okay, fine 😭'
  ];

  var noLabelsShort = [
    'No',
    'Sure?',
    'Really?',
    'Think 🥺',
    'Last one',
    'My heart 💔',
    'Wait...',
    'Nope 😌',
    'Fine 😭'
  ];

  var dodgeHints = [
    'see? shy.',
    'it is getting nervous.',
    'the button is running out of room.',
    'you are really committed to this bit.',
    'it is shrinking. emotionally.',
    'the site is begging you.',
    'look at the yes button. it is glowing.',
    'okay. the "no" button has officially resigned.',
    'it is Yes or Yes now. 💗'
  ];

  function dodge() {
    if (accepted || !noBtn || !zone || !yesBtn) return;
    dodges++;

    var labels = window.innerWidth < 460 ? noLabelsShort : noLabels;
    noBtn.textContent = labels[Math.min(dodges, labels.length - 1)];

    var zr = zone.getBoundingClientRect();

    if (!noBtn.classList.contains('loose')) {
      var br = noBtn.getBoundingClientRect();
      noBtn.style.left = (br.left - zr.left) + 'px';
      noBtn.style.top = (br.top - zr.top) + 'px';
      noBtn.classList.add('loose');
    }

    // measure after the new label is in place so it can never spill out
    var nw = noBtn.offsetWidth;
    var nh = noBtn.offsetHeight;
    var yr = yesBtn.getBoundingClientRect();
    var pad = 8;
    var maxX = Math.max(pad, zr.width - nw - pad);
    var maxY = Math.max(pad, zr.height - nh - pad);
    var x = pad, y = pad;

    for (var t = 0; t < 16; t++) {
      x = rand(pad, maxX);
      y = rand(pad, maxY);
      var hitX = x < (yr.right - zr.left) && (x + nw) > (yr.left - zr.left);
      var hitY = y < (yr.bottom - zr.top) && (y + nh) > (yr.top - zr.top);
      if (!(hitX && hitY)) break;
    }

    noBtn.style.left = x + 'px';
    noBtn.style.top = y + 'px';

    var scale = Math.max(0.52, 1 - dodges * 0.055);
    noBtn.style.transform = 'scale(' + scale + ')';

    if (dodges >= 3) {
      var grow = Math.min(1.16, 1 + (dodges - 2) * 0.03);
      yesBtn.style.transform = 'scale(' + grow + ')';
    }

    if (hintEl) hintEl.textContent = dodgeHints[Math.min(dodges - 1, dodgeHints.length - 1)];

    if (dodges >= 9) {
      noBtn.classList.add('gone');
      if (hintEl) hintEl.textContent = 'okay. the "no" button has officially resigned. it is Yes or Yes. 💗';
    }
  }

  /* ---------------- audio ---------------- */
  var soundBtn = $('#sound');
  var actx = null;
  var master = null;
  var loopTimer = null;
  var playing = false;
  var audioBroken = false;

  function ensureAudio() {
    if (actx || audioBroken) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { audioBroken = true; return; }
    try {
      actx = new AC();
      master = actx.createGain();
      master.gain.value = 0.5;
      master.connect(actx.destination);
    } catch (err) {
      audioBroken = true;
    }
  }

  function playNote(midi, dur, vel) {
    if (!actx || !master) return;
    var t = actx.currentTime;
    var f = 440 * Math.pow(2, (midi - 69) / 12);

    var o1 = actx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = f;

    var o2 = actx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = f;
    o2.detune.value = 5;

    var g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, 0.085 * vel), t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o1.connect(g);
    o2.connect(g);
    g.connect(master);
    o1.start(t);
    o2.start(t);
    o1.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
  }

  function playPad(midi) {
    if (!actx || !master) return;
    var t = actx.currentTime;
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    [1, 1.5, 2].forEach(function (mult, i) {
      var o = actx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mult;
      o.detune.value = rand(-6, 6);
      var g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.03 / (i + 1), t + 1.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.4);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 4.5);
    });
  }

  var melody = [
    72, 76, 79, 84, 83, 79, 76, 72,
    74, 77, 81, 86, 84, 81, 77, 74,
    76, 79, 83, 88, 86, 83, 79, 76,
    72, 76, 79, 84, 88, 84, 79, 76
  ];
  var chords = [48, 50, 52, 48];

  function startLoop() {
    if (!actx) return;
    if (loopTimer) window.clearInterval(loopTimer);
    var i = 0;
    loopTimer = window.setInterval(function () {
      if (!playing) return;
      playNote(melody[i % melody.length], 1.6, i % 4 === 0 ? 0.95 : 0.6);
      if (i % 8 === 0) playPad(chords[Math.floor(i / 8) % chords.length]);
      i++;
    }, 300);
  }

  function victorySound() {
    ensureAudio();
    if (!actx) return;
    if (actx.state === 'suspended') actx.resume();
    var old = playing;
    playing = true;
    var arp = [72, 76, 79, 84, 88, 91, 96];
    arp.forEach(function (m, i) {
      window.setTimeout(function () { playNote(m, 1.1, 1); }, i * 120);
    });
    window.setTimeout(function () { playing = old; }, arp.length * 120 + 400);
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', function () {
      ensureAudio();
      if (audioBroken || !actx) {
        soundBtn.querySelector('.sound__label').textContent = 'no sound';
        return;
      }
      if (actx.state === 'suspended') actx.resume();

      playing = !playing;
      soundBtn.classList.toggle('playing', playing);
      soundBtn.setAttribute('aria-pressed', String(playing));
      soundBtn.querySelector('.sound__label').textContent = playing ? 'music on' : 'music';

      var now = actx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(playing ? 0.5 : 0.0001, now, 0.12);

      if (playing) {
        startLoop();
      } else if (loopTimer) {
        window.clearInterval(loopTimer);
        loopTimer = null;
      }
    });
  }

  /* ---------------- celebrate ---------------- */
  function celebrate() {
    if (accepted) return;
    accepted = true;

    if (ask) ask.classList.add('celebrating');
    document.body.classList.add('celebrated');
    if (saidEl) saidEl.setAttribute('aria-hidden', 'false');
    if (noBtn) noBtn.classList.add('gone');

    document.title = 'She said YES ♥';

    flash();
    confettiShow();
    if (!reduced) heartsRain();
    victorySound();

    if (ask && ask.scrollIntoView) {
      window.setTimeout(function () {
        ask.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }, 120);
    }
  }

  if (yesBtn) yesBtn.addEventListener('click', celebrate);

  if (noBtn) {
    noBtn.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') dodge();
    });
    noBtn.addEventListener('click', function (e) {
      e.preventDefault();
      dodge();
    });
    noBtn.addEventListener('focus', function () {
      if (dodges < 1) dodge();
    });
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('cursor-ready')) {
      document.body.classList.remove('cursor-ready');
    }
  });

})();
