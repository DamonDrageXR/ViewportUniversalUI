/* ==========================================================================
   Studio — shared client helpers
   ========================================================================== */

(() => {
  "use strict";

  const api = async (method, path, body) => {
    const res = await fetch(`/api${path}`, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.error || `${method} ${path} failed (${res.status})`);
    return data;
  };

  /* A destructive action gets a real confirmation naming what is about to go,
     because delete here removes a folder from disk. Versions are never
     implicitly destroyed — only the one you name. */
  const confirmDelete = (what, detail) =>
    window.confirm(`Delete ${what}?\n\n${detail}\n\nThis removes the files from disk. It cannot be undone from the studio.`);

  const toast = (message, tone = "") => {
    let host = document.querySelector(".studio__toasts");
    if (!host) {
      host = document.createElement("div");
      host.className = "studio__toasts";
      document.body.append(host);
    }
    const el = document.createElement("div");
    el.className = "vp-toast";
    el.innerHTML = tone ? `<span class="vp-badge ${tone}"></span>` : "";
    el.append(document.createTextNode(message));
    host.append(el);
    setTimeout(() => el.remove(), 4000);
  };

  const fail = (err) => {
    console.error(err);
    toast(err.message || "Something went wrong", "vp-badge--critical");
  };

  /** Prompt for a name, returning null if the user cancels or enters nothing. */
  const ask = (question, fallback = "") => {
    const value = window.prompt(question, fallback);
    return value && value.trim() ? value.trim() : null;
  };

  window.Studio = { api, confirmDelete, toast, fail, ask };
})();
