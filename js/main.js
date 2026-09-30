const menuBtn = document.querySelector("[data-menu]");
const drawer = document.querySelector("[data-drawer]");

if (menuBtn && drawer) {
  const closeMenu = () => {
    drawer.classList.remove("open");
    document.body.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
  };

  const openMenu = () => {
    drawer.classList.add("open");
    document.body.classList.add("menu-open");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Close menu");
  };

  menuBtn.addEventListener("click", () => {
    drawer.classList.contains("open") ? closeMenu() : openMenu();
  });

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

const upload = document.querySelector("#references");
const preview = document.querySelector("#preview");
let previewUrls = [];

if (upload && preview) {
  upload.addEventListener("change", () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls = [];
    preview.innerHTML = "";

    [...upload.files].slice(0, 8).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const img = document.createElement("img");
      const url = URL.createObjectURL(file);
      previewUrls.push(url);
      img.alt = `Reference preview: ${file.name}`;
      img.src = url;
      preview.appendChild(img);
    });
  });
}

const bookingForm = document.querySelector("#booking-form");
if (bookingForm) {
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!bookingForm.checkValidity()) {
      bookingForm.reportValidity();
      return;
    }

    const success = document.querySelector("#success");
    if (success) {
      success.classList.add("show");
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

// Prototype-only filters: prevent placeholder links from jumping the page.
document.querySelectorAll('.filters a[href="#"]').forEach((filter) => {
  filter.addEventListener("click", (event) => {
    event.preventDefault();
    filter.parentElement
      ?.querySelectorAll("a")
      .forEach((item) => item.classList.remove("active"));
    filter.classList.add("active");
  });
});

// Mark the current page explicitly. The logo remains clickable, but Home is also visible in navigation.
(() => {
  const current = window.location.pathname.split("/").pop() || "index.html";
  document
    .querySelectorAll(".nav a, .mobile-drawer > a:not(.btn)")
    .forEach((link) => {
      const raw = link.getAttribute("href") || "";
      if (!raw || raw.includes("#")) return;
      const target = raw.split("/").pop() || "index.html";
      if (target === current) link.setAttribute("aria-current", "page");
    });
})();

// Remote social/demo assets should fail gracefully instead of leaving broken-image icons.
document
  .querySelectorAll(".remote-artist-photo, .remote-content-photo")
  .forEach((img) => {
    img.addEventListener("error", () => {
      img.hidden = true;
    });
  });

// Booking: every permanent service has one responsible route.
// Tattoo -> Arthur, Piercing -> Vahagn, Removal -> studio consultation.
(() => {
  const form = document.querySelector("#booking-form");
  if (!form) return;

  const serviceInputs = [...form.querySelectorAll('input[name="service"]')];
  const removalNote = form.querySelector("[data-removal-note]");
  const guestArtistNote = form.querySelector("[data-guest-artist-note]");
  const autoTattoo = form.querySelector("[data-auto-tattoo]");
  const autoPiercing = form.querySelector("[data-auto-piercing]");
  const autoRemoval = form.querySelector("[data-auto-removal]");
  const stepNumbers = [...form.querySelectorAll("[data-step-number]")];

  const updateStepNumbers = () => {
    let visibleIndex = 0;
    stepNumbers.forEach((node) => {
      const step = node.closest(".form-step");
      if (!step || step.hidden) return;
      visibleIndex += 1;
      node.textContent = String(visibleIndex).padStart(2, "0");
    });
  };

  const updateServiceFlow = () => {
    const selected = serviceInputs.find((input) => input.checked)?.value || "";
    const isTattoo =
      selected === "Tattoo" || selected === "Тату" || selected === "Տատու";
    const isPiercing =
      selected === "Piercing" ||
      selected === "Пирсинг" ||
      selected === "Փիրսինգ";
    const isRemoval = !isTattoo && !isPiercing;

    if (guestArtistNote) guestArtistNote.hidden = !isTattoo;
    if (removalNote) removalNote.hidden = !isRemoval;
    if (autoTattoo) autoTattoo.disabled = !isTattoo;
    if (autoPiercing) autoPiercing.disabled = !isPiercing;
    if (autoRemoval) autoRemoval.disabled = !isRemoval;
    updateStepNumbers();
  };

  const params = new URLSearchParams(window.location.search);
  const requestedService = params.get("service");
  if (requestedService) {
    const service = serviceInputs.find(
      (input) => input.value.toLowerCase() === requestedService.toLowerCase(),
    );
    if (service) service.checked = true;
  }

  serviceInputs.forEach((input) =>
    input.addEventListener("change", updateServiceFlow),
  );
  updateServiceFlow();
})();

// Browser favicon: render only “14” in Anton on a transparent canvas.
// This avoids the old white square/cropped logo while using the same webfont as the site.
(() => {
  const apply = async () => {
    try {
      await document.fonts.load("400 160px Anton");
    } catch (_) { }
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "400 188px Anton, Impact, sans-serif";
    ctx.fillText("14", 128, 134);
    let link = document.querySelector("link[data-dynamic-favicon]");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.setAttribute("data-dynamic-favicon", "");
      document.head.appendChild(link);
    }
    link.href = canvas.toDataURL("image/png");
  };
  apply();
})();

// Original brand logo on the home hero. If the remote demo asset cannot load,
// show the typographic fallback instead of a broken image icon.
document.querySelectorAll(".hero-logo-original").forEach((img) => {
  const fail = () =>
    img.closest(".hero-logo-wrap")?.classList.add("logo-failed");
  img.addEventListener("error", fail);
  if (img.complete && img.naturalWidth === 0) fail();
});

// Gallery lightbox: representative work and studio interior images enlarge on click.
(() => {
  const images = [
    ...document.querySelectorAll(".work-card img, .studio-grid img"),
  ].filter((img) => !img.hidden);
  if (!images.length) return;

  const overlay = document.createElement("div");
  overlay.className = "gallery-lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Image preview");
  overlay.innerHTML = `
    <div class="gallery-lightbox__stage">
      <div class="gallery-lightbox__image-wrap"><img class="gallery-lightbox__image" alt=""></div>
      <div class="gallery-lightbox__meta"><span class="gallery-lightbox__caption"></span><span class="gallery-lightbox__count"></span></div>
      <button class="gallery-lightbox__close" type="button" aria-label="Close image preview">×</button>
      <button class="gallery-lightbox__prev" type="button" aria-label="Previous image">←</button>
      <button class="gallery-lightbox__next" type="button" aria-label="Next image">→</button>
    </div>`;
  document.body.appendChild(overlay);

  const shown = overlay.querySelector(".gallery-lightbox__image");
  const caption = overlay.querySelector(".gallery-lightbox__caption");
  const count = overlay.querySelector(".gallery-lightbox__count");
  const close = overlay.querySelector(".gallery-lightbox__close");
  const prev = overlay.querySelector(".gallery-lightbox__prev");
  const next = overlay.querySelector(".gallery-lightbox__next");
  let index = 0;
  let lastFocus = null;

  const labelFor = (img) => {
    const figure = img.closest("figure");
    const figcaption = figure?.querySelector("figcaption")?.textContent?.trim();
    return figcaption || img.alt || "";
  };
  const render = () => {
    const img = images[index];
    shown.src = img.currentSrc || img.src;
    shown.alt = img.alt || labelFor(img);
    caption.textContent = labelFor(img);
    count.textContent = `${index + 1} / ${images.length}`;
    const multi = images.length > 1;
    prev.hidden = !multi;
    next.hidden = !multi;
  };
  const open = (i) => {
    index = i;
    lastFocus = document.activeElement;
    render();
    overlay.classList.add("open");
    document.body.classList.add("lightbox-open");
    close.focus();
  };
  const closeBox = () => {
    overlay.classList.remove("open");
    document.body.classList.remove("lightbox-open");
    shown.removeAttribute("src");
    lastFocus?.focus?.();
  };
  const move = (delta) => {
    index = (index + delta + images.length) % images.length;
    render();
  };

  images.forEach((img, i) => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute(
      "aria-label",
      `${labelFor(img) || "Image"}. Open larger view`,
    );
    img.addEventListener("click", () => open(i));
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(i);
      }
    });
  });
  close.addEventListener("click", closeBox);
  prev.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeBox();
  });
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") closeBox();
    if (e.key === "ArrowLeft") move(-1);
    if (e.key === "ArrowRight") move(1);
  });
})();
