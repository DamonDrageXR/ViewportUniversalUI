/* ==========================================================================
   Viewport Universal UI — Stage controls
   --------------------------------------------------------------------------
   Drop-in review tooling for any mockup. Include it and it wires itself up:

     <script src="../../system/stage.js" defer></script>

   It injects a control bar into `.stage` offering theme, an 8px grid overlay,
   a hit-target overlay, and fit-to-window scaling. No dependencies, no build,
   works from file:// — double-clicking the .html file is a valid workflow.
   ========================================================================== */

(() => {
  "use strict";

  const STORE_KEY = "vp-stage-prefs";

  // Preferences are a per-reviewer convenience only. If storage is blocked
  // (private window, file:// in some browsers) the stage still works.
  const readPrefs = () => {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch {
      return {};
    }
  };

  const writePrefs = (prefs) => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
    } catch {
      /* not worth surfacing — the toggles still apply to this page view */
    }
  };

  const prefs = readPrefs();

  const toggleButton = (label, initial, onChange) => {
    const btn = document.createElement("button");
    btn.className = "vp-btn vp-btn--secondary";
    btn.type = "button";
    btn.textContent = label;
    let on = Boolean(initial);
    const apply = () => {
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("vp-btn--primary", on);
      btn.classList.toggle("vp-btn--secondary", !on);
      onChange(on);
    };
    btn.addEventListener("click", () => {
      on = !on;
      apply();
    });
    apply();
    return btn;
  };

  /* Scale each device frame down so it fits the window, without altering the
     layout maths inside it. The frame keeps its true logical pixel size — only
     the presentation is scaled — so type and hit targets stay honest. */
  const fitFrames = (enabled) => {
    document.querySelectorAll(".device").forEach((device) => {
      device.classList.toggle("is-fit", enabled);
      if (!enabled) {
        device.style.removeProperty("--fit-scale");
        device.style.removeProperty("--fit-height");
        return;
      }
      const available = document.documentElement.clientWidth - 64;
      const natural = device.offsetWidth;
      const scale = Math.min(1, available / natural);
      device.style.setProperty("--fit-scale", scale.toFixed(4));
      device.style.setProperty("--fit-height", `${device.offsetHeight}px`);
    });
  };

  const init = () => {
    const stage = document.querySelector(".stage");
    if (!stage) return;

    // Embedded as a thumbnail or a live preview: show the device, nothing else.
    if (new URLSearchParams(location.search).get("chrome") === "0") {
      stage.classList.add("is-bare");
      fitFrames(true);
      window.addEventListener("resize", () => fitFrames(true));
      return;
    }

    const bar = document.createElement("div");
    bar.className = "stage__bar";

    const root = document.documentElement;
    const pinned = root.getAttribute("data-theme");
    const startLight = pinned ? pinned === "light" : Boolean(prefs.light);

    bar.append(
      toggleButton("Light theme", startLight, (on) => {
        root.setAttribute("data-theme", on ? "light" : "dark");
        prefs.light = on;
        writePrefs(prefs);
      }),
      toggleButton("8px grid", prefs.grid, (on) => {
        stage.classList.toggle("show-grid", on);
        prefs.grid = on;
        writePrefs(prefs);
      }),
      toggleButton("Hit targets", prefs.hit, (on) => {
        stage.classList.toggle("show-hit", on);
        prefs.hit = on;
        writePrefs(prefs);
      }),
      toggleButton("Fit to window", prefs.fit ?? true, (on) => {
        fitFrames(on);
        prefs.fit = on;
        writePrefs(prefs);
      })
    );

    const header = stage.querySelector(".stage__header");
    if (header) header.after(bar);
    else stage.prepend(bar);

    let resizeTimer;
    window.addEventListener("resize", () => {
      if (!(prefs.fit ?? true)) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => fitFrames(true), 100);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
