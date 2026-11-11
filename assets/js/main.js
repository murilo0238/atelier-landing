/* ATELIER — interações (sem dependências). */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Revelação ao rolar ---------- */
  var revealTargets = $$(".reveal, .reveal-lines, .unveil, .draw, .step");
  if ("IntersectionObserver" in window && !reduceMotion) {
    // Elementos escondidos com clip-path têm área visível zero para o IntersectionObserver,
    // então observamos o elemento pai e revelamos os filhos registrados nele.
    var watched = new Map();
    revealTargets.forEach(function (el) {
      var anchor = el.matches(".reveal-lines, .unveil") ? el.parentElement : el;
      if (!watched.has(anchor)) watched.set(anchor, []);
      watched.get(anchor).push(el);
    });
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        watched.get(entry.target).forEach(function (el) { el.classList.add("in"); });
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    watched.forEach(function (_, anchor) { revealer.observe(anchor); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Barra fixa, progresso e parallax ---------- */
  var bar = $("[data-bar]");
  var hero = $(".hero");
  var heroMedia = $("[data-parallax]");
  var progress = $("[data-progress]");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var heroH = hero ? hero.offsetHeight : 0;
    bar.classList.toggle("is-visible", y > heroH - 80);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);

    if (heroMedia && !reduceMotion && y < heroH) {
      heroMedia.style.transform = "translate3d(0," + (y * 0.22).toFixed(1) + "px,0)";
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Link ativo na barra ---------- */
  var navLinks = $$(".bar-nav a");
  if ("IntersectionObserver" in window && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) {
      var section = $(a.getAttribute("href"));
      if (section) spy.observe(section);
    });
  }

  /* ---------- Menu mobile ---------- */
  var menu = $("[data-menu]");
  var openBtn = $("[data-menu-open]");
  var closeBtn = $("[data-menu-close]");

  function openMenu() {
    menu.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    closeBtn.focus();
  }
  function closeMenu(restoreFocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    if (restoreFocus) openBtn.focus();
  }
  openBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", function () { closeMenu(true); });
  $$("a", menu).forEach(function (a) {
    a.addEventListener("click", function () { closeMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (menu.hidden) return;
    if (e.key === "Escape") closeMenu(true);
    if (e.key === "Tab") {
      // Mantém o foco dentro do menu aberto.
      var focusables = $$("a, button", menu);
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia("(min-width: 761px)").addEventListener("change", function (mq) {
    if (mq.matches) closeMenu(false);
  });

  /* ---------- Seletor de projetos ---------- */
  var picker = $("[data-picker]");
  var projects = [
    { name: "Casa Horizonte", href: "#projeto-horizonte", img: "assets/img/thumb-horizonte.webp" },
    { name: "Residência Origem", href: "#projeto-origem", img: "assets/img/thumb-origem.webp" },
    { name: "Casa Pátio", href: "#projeto-patio", img: "assets/img/thumb-patio.webp" }
  ];
  var current = 0;
  projects.forEach(function (p) { new Image().src = p.img; });

  function showProject(index) {
    current = (index + projects.length) % projects.length;
    var p = projects[current];
    var apply = function () {
      $("[data-picker-name]", picker).textContent = p.name;
      $("[data-picker-index]", picker).textContent = "0" + (current + 1);
      $("[data-picker-img]", picker).src = p.img;
      $("[data-picker-link]", picker).setAttribute("href", p.href);
      picker.classList.remove("is-switching");
    };
    if (reduceMotion) return apply();
    picker.classList.add("is-switching");
    window.setTimeout(apply, 220);
  }
  $("[data-prev]", picker).addEventListener("click", function () { showProject(current - 1); });
  $("[data-next]", picker).addEventListener("click", function () { showProject(current + 1); });

  /* ---------- Formulário (demonstrativo) ---------- */
  var form = $("[data-form]");
  var msg = $("[data-form-msg]");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var invalid = $$("input[required], textarea[required]", form).filter(function (field) {
      var bad = !field.value.trim() || (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value.trim()));
      field.setAttribute("aria-invalid", bad ? "true" : "false");
      return bad;
    });

    msg.className = "form-msg";
    if (invalid.length) {
      msg.classList.add("is-error");
      msg.textContent = "Preencha nome, um e-mail válido e conte um pouco sobre o projeto.";
      invalid[0].focus();
      return;
    }

    var nome = form.elements.nome.value.trim().split(" ")[0];
    msg.classList.add("is-ok");
    msg.innerHTML = "";
    msg.appendChild(document.createTextNode("Obrigado, " + nome + "! A ATELIER é um projeto conceito, então nenhuma mensagem foi enviada. Gostou deste site? "));
    var link = document.createElement("a");
    link.href = "https://garrastudios.online/?servico=site#contato";
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Fale com a Garra Studios";
    msg.appendChild(link);
    msg.appendChild(document.createTextNode("."));
    form.reset();
  });
  $$("input, textarea", form).forEach(function (field) {
    field.addEventListener("input", function () { field.removeAttribute("aria-invalid"); });
  });
})();
