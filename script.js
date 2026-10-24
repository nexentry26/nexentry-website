document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;

  // Copyright year
  const yearEl = document.getElementById("copyright-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Letter-by-letter headline split ----------
  document.querySelectorAll(".line.split").forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    let i = 0;
    text.split(" ").forEach((word, wi, arr) => {
      const w = document.createElement("span");
      w.className = "word";
      w.setAttribute("aria-hidden", "true");
      [...word].forEach((ch) => {
        const c = document.createElement("span");
        c.className = "ch";
        c.style.setProperty("--i", i++);
        c.textContent = ch;
        w.appendChild(c);
      });
      el.appendChild(w);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(" "));
    });
  });

  // ---------- Preloader ----------
  const preloader = document.getElementById("preloader");
  let readyFired = false;
  const markReady = () => {
    if (readyFired) return;
    readyFired = true;
    root.classList.add("ready");
  };
  const hidePreloader = () => {
    if (!preloader) { markReady(); return; }
    preloader.classList.add("done");
    document.body.classList.remove("locked");
    setTimeout(markReady, 350);
    setTimeout(() => preloader.remove(), 1600);
  };
  if (preloader) {
    document.body.classList.add("locked");
    const minWait = reduceMotion ? 0 : 1500;
    const start = performance.now();
    const finish = () => setTimeout(hidePreloader, Math.max(0, minWait - (performance.now() - start)));
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish);
    setTimeout(hidePreloader, 4000); // safety net
  } else {
    markReady();
  }

  // ---------- Header, scroll progress, parallax, marquee velocity ----------
  const header = document.getElementById("site-header");
  const progress = document.getElementById("scroll-progress");
  const marquee = document.getElementById("marquee");
  const orbs = document.querySelectorAll(".hero-orb");
  let lastY = window.scrollY, vel = 0;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 40);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    if (!reduceMotion) {
      // Orbs drift at different speeds as you scroll
      orbs.forEach((orb, i) => {
        orb.style.translate = `0px ${y * (i === 0 ? 0.18 : -0.12)}px`;
      });
      vel += (y - lastY) * 0.12;
    }
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (marquee && !reduceMotion) {
    const group = () => marquee.querySelectorAll(".marquee-group");
    const decay = () => {
      vel *= 0.9;
      const clamped = Math.max(-10, Math.min(10, vel));
      group().forEach((g) => g.style.setProperty("--vel", clamped.toFixed(2)));
      requestAnimationFrame(decay);
    };
    decay();
  }

  // ---------- Mobile menu ----------
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("primary-nav");
  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
    nav.classList.remove("open");
  };
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open navigation menu" : "Close navigation menu");
      nav.classList.toggle("open", !open);
    });
    nav.querySelectorAll("a").forEach((l) => l.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }

  // ---------- Active nav link ----------
  const navLinks = [...document.querySelectorAll("[data-nav]")];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => navObserver.observe(s));
  }

  // ---------- Scroll reveal ----------
  const stepsEl = document.getElementById("process-steps");
  const activateSteps = () => {
    if (!stepsEl) return;
    const steps = stepsEl.querySelectorAll(".step");
    steps.forEach((s, i) => setTimeout(() => s.classList.add("on"), reduceMotion ? 0 : 500 + i * 620));
  };

  const revealEls = document.querySelectorAll(".reveal, #process-steps, #footer-giant");
  const onReveal = (el) => {
    el.classList.add("in");
    if (el.classList.contains("tilt-card")) {
      setTimeout(() => el.classList.add("settled"), 1600);
    }
    if (el.id === "process-steps") activateSteps();
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onReveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach(onReveal);
  }

  // ---------- Counters ----------
  const counters = document.querySelectorAll("[data-count]");
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = target; return; }
    const duration = 1600;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  counters.forEach((el) => { el.dataset.suffix = el.dataset.suffix || ""; });
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach((el) => co.observe(el));
  } else counters.forEach(runCounter);

  // ---------- Rotating words ----------
  const rotator = document.getElementById("rotator");
  if (rotator && !reduceMotion) {
    const words = ["websites", "automations", "digital presence", "smarter workflows"];
    let w = 0, c = words[0].length, deleting = true;
    const step = () => {
      const word = words[w];
      rotator.textContent = word.slice(0, c);
      let delay = deleting ? 45 : 85;
      if (!deleting && c === word.length) { deleting = true; delay = 1600; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      else c += deleting ? -1 : 1;
      setTimeout(step, delay);
    };
    setTimeout(step, 2200);
  }

  // ---------- Cursor glow + ring ----------
  const glow = document.getElementById("cursor-glow");
  const ring = document.getElementById("cursor-ring");
  if (finePointer && !reduceMotion && (glow || ring)) {
    let gx = 0, gy = 0, rx = 0, ry = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      glow && glow.classList.add("on");
      ring && ring.classList.add("on");
    }, { passive: true });
    document.addEventListener("pointerleave", () => {
      glow && glow.classList.remove("on");
      ring && ring.classList.remove("on");
    });
    if (ring) {
      document.addEventListener("pointerover", (e) => {
        ring.classList.toggle("hover", !!e.target.closest("a, button, input, select, textarea, .tilt-card"));
      });
      window.addEventListener("pointerdown", () => ring.classList.add("down"));
      window.addEventListener("pointerup", () => ring.classList.remove("down"));
    }
    const loop = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      rx += (tx - rx) * 0.22; ry += (ty - ry) * 0.22;
      if (glow) glow.style.transform = `translate(${gx}px, ${gy}px)`;
      if (ring) ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  // ---------- Spotlight cards ----------
  document.querySelectorAll(".spotlight").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // ---------- 3D tilt cards ----------
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  // ---------- Hero 3D tilt + floating shape parallax ----------
  const tilt = document.getElementById("tilt");
  const heroArt = document.querySelector(".hero-art");
  if (tilt && heroArt && finePointer && !reduceMotion) {
    heroArt.addEventListener("pointermove", (e) => {
      const r = heroArt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 10}deg)`;
    });
    heroArt.addEventListener("pointerleave", () => { tilt.style.transform = ""; });
  }

  const hero = document.getElementById("home");
  const shapes = document.querySelectorAll(".float-shapes .shape");
  if (hero && shapes.length && finePointer && !reduceMotion) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      shapes.forEach((s) => {
        const d = Number(s.dataset.depth) || 20;
        s.style.setProperty("--px", `${(x * d).toFixed(1)}px`);
        s.style.setProperty("--py", `${(y * d).toFixed(1)}px`);
      });
    });
    hero.addEventListener("pointerleave", () => {
      shapes.forEach((s) => { s.style.setProperty("--px", "0px"); s.style.setProperty("--py", "0px"); });
    });
  }

  // ---------- Magnetic buttons ----------
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.25;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.35;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  // ---------- Button click ripple ----------
  document.querySelectorAll(".button").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      if (reduceMotion) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2;
      const dot = document.createElement("span");
      dot.className = "ripple";
      dot.style.width = dot.style.height = `${size}px`;
      dot.style.left = `${e.clientX - r.left - size / 2}px`;
      dot.style.top = `${e.clientY - r.top - size / 2}px`;
      btn.appendChild(dot);
      setTimeout(() => dot.remove(), 700);
    });
  });

  // ---------- Hero particle network (amber) ----------
  const canvas = document.getElementById("hero-canvas");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, particles = [], running = true;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(Math.floor((w * h) / 16000), 90);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8,
      }));
    };
    resize();
    window.addEventListener("resize", resize);
    canvas.parentElement.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

    const draw = () => {
      if (running) {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;

          const dxm = p.x - mouse.x, dym = p.y - mouse.y;
          const dm = Math.hypot(dxm, dym);
          if (dm < 140 && dm > 0) { p.x += (dxm / dm) * 1.2; p.y += (dym / dm) * 1.2; }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(217, 119, 6, .7)";
          ctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d < 130) {
              ctx.strokeStyle = `rgba(245, 158, 11, ${0.3 * (1 - d / 130)})`;
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
            }
          }
        }
      }
      requestAnimationFrame(draw);
    };
    draw();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(canvas);
    }
  }

  // ---------- Confetti burst ----------
  const confetti = (originEl) => {
    if (reduceMotion) return;
    const r = originEl.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const colors = ["#f59e0b", "#fbbf24", "#d97706", "#fde68a", "#1a1408"];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement("i");
      p.className = "confetti";
      const angle = Math.random() * Math.PI * 2;
      const dist = 90 + Math.random() * 220;
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--ty", `${Math.sin(angle) * dist + 120}px`);
      p.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
      p.style.setProperty("--dur", `${1.2 + Math.random() * 0.9}s`);
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 2400);
    }
  };

  // ---------- Form demo handling ----------
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (form && status) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        status.textContent = "Please fill in all required fields correctly.";
        status.className = "form-status error";
        form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
        form.reportValidity();
        return;
      }
      status.textContent = "Thanks! This is a demo — your enquiry was not sent.";
      status.className = "form-status success";
      confetti(form.querySelector(".form-submit"));
      form.reset();
    });
  }
});