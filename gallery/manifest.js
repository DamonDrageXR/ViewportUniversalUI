/* ==========================================================================
   Mockup manifest — the index the gallery reads.
   --------------------------------------------------------------------------
   A plain .js file rather than .json on purpose: a <script> tag loads over
   file://, whereas fetch("manifest.json") is blocked by the browser's
   file-origin rules. That keeps "double-click index.html" a working workflow
   with no server and no build step.

   Regenerate with `node tools/reindex.mjs`, or just edit it by hand — it is
   only ever read by the gallery.
   ========================================================================== */

window.VP_MOCKUPS = [
  {
    "slug": "001-field-ar-layer-control",
    "title": "Field AR — Layer Control",
    "target": "iPad Pro landscape",
    "status": "reference",
    "updated": "2026-09-17",
    "summary": "One-handed field layout: tool rail left, layer tree right, telemetry centred. The worked example for how the system is meant to be used."
  }
];
