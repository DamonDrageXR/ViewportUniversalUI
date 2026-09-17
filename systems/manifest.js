/* ==========================================================================
   GENERATED FILE — run `node tools/reindex.mjs` to rebuild.

   A plain .js rather than .json so a <script> tag loads it over file://,
   where fetch() of a local JSON file is blocked.
   ========================================================================== */

window.VP_SYSTEMS = [
  {
    "id": "paper-v1",
    "family": "paper",
    "version": 1,
    "name": "Paper",
    "note": "The hand-drawn wireframe language. Reads as a draft, behaves like a working prototype. Greyscale carries all structure; colour is rationed to a status and the one required action.",
    "updated": "2026-09-17",
    "isLatest": true,
    "accent": "#1d56ad",
    "lineWeight": 2,
    "iconStroke": 1,
    "themes": [
      "light"
    ],
    "rules": {
      "shadows": "none",
      "buttonFill": "paper",
      "colourPolicy": "rationed",
      "disabledPattern": "hatch-45",
      "themes": "light-only",
      "controlFeedback": "grey-ladder",
      "numeralFace": "mono",
      "dividerStyle": "dashed"
    },
    "hasComponents": false,
    "surfaces": [
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#ffffff"
    ],
    "mockups": [
      {
        "id": "active-experience-v1",
        "family": "active-experience",
        "version": 1,
        "title": "Experience running",
        "status": "review",
        "summary": "State 3: the view is sacred. UI collapses to thin strips of 96px or less, placed only in reach zones, and never crosses the middle of a live view.",
        "updated": "2026-09-17",
        "screens": [
          {
            "device": "phone",
            "file": "phone.html",
            "title": "One-thumb strip",
            "href": "systems/paper-v1/mockups/active-experience-v1/phone.html"
          },
          {
            "device": "ipad-landscape",
            "file": "ipad-landscape.html",
            "title": "Reach zones",
            "href": "systems/paper-v1/mockups/active-experience-v1/ipad-landscape.html"
          },
          {
            "device": "headset",
            "file": "headset.html",
            "title": "Wrist menu",
            "href": "systems/paper-v1/mockups/active-experience-v1/headset.html"
          }
        ],
        "devices": [
          "phone",
          "ipad-landscape",
          "headset"
        ],
        "href": "systems/paper-v1/mockups/active-experience-v1/phone.html"
      },
      {
        "id": "config-experience-v1",
        "family": "config-experience",
        "version": 1,
        "title": "Configuring, experience held",
        "status": "review",
        "summary": "State 2: the spatial view is live but held. Exactly one wide, edge-justified panel, never more than 35% of the screen, and the view never closes behind it.",
        "updated": "2026-09-17",
        "screens": [
          {
            "device": "ipad-landscape",
            "file": "ipad-landscape.html",
            "title": "Place the model",
            "href": "systems/paper-v1/mockups/config-experience-v1/ipad-landscape.html"
          },
          {
            "device": "desktop",
            "file": "desktop.html",
            "title": "Scene setup",
            "href": "systems/paper-v1/mockups/config-experience-v1/desktop.html"
          },
          {
            "device": "headset",
            "file": "headset.html",
            "title": "Anchored panel",
            "href": "systems/paper-v1/mockups/config-experience-v1/headset.html"
          }
        ],
        "devices": [
          "ipad-landscape",
          "desktop",
          "headset"
        ],
        "href": "systems/paper-v1/mockups/config-experience-v1/ipad-landscape.html"
      },
      {
        "id": "outside-experience-v1",
        "family": "outside-experience",
        "version": 1,
        "title": "Outside the experience",
        "status": "review",
        "summary": "State 1 of the spatial rulebook: nothing spatial is running yet, so the UI owns the whole screen and is plain paper. Joining is a pairing code or a room, never a web sign-in.",
        "updated": "2026-09-17",
        "screens": [
          {
            "device": "phone",
            "file": "phone.html",
            "title": "Join a room",
            "href": "systems/paper-v1/mockups/outside-experience-v1/phone.html"
          },
          {
            "device": "ipad-landscape",
            "file": "ipad-landscape.html",
            "title": "Session browser",
            "href": "systems/paper-v1/mockups/outside-experience-v1/ipad-landscape.html"
          },
          {
            "device": "desktop",
            "file": "desktop.html",
            "title": "Operator console",
            "href": "systems/paper-v1/mockups/outside-experience-v1/desktop.html"
          }
        ],
        "devices": [
          "phone",
          "ipad-landscape",
          "desktop"
        ],
        "href": "systems/paper-v1/mockups/outside-experience-v1/phone.html"
      }
    ]
  },
  {
    "id": "viewport-xr-v1",
    "family": "viewport-xr",
    "version": 1,
    "name": "Viewport XR",
    "note": "",
    "updated": "2026-09-17",
    "isLatest": true,
    "accent": "#1e88ff",
    "lineWeight": 1,
    "iconStroke": 1.6,
    "themes": [
      "dark",
      "light"
    ],
    "rules": {
      "shadows": "soft",
      "buttonFill": "accent",
      "colourPolicy": "open",
      "disabledPattern": "dim",
      "themes": "both",
      "controlFeedback": "fill",
      "numeralFace": "inherit",
      "dividerStyle": "solid"
    },
    "hasComponents": false,
    "surfaces": [
      "#080a0c",
      "#0f1115",
      "#15181e",
      "#2a303c"
    ],
    "mockups": [
      {
        "id": "field-ar-v1",
        "family": "field-ar",
        "version": 1,
        "title": "Field AR",
        "status": "review",
        "summary": "The GEAAR field tool across every screen it ships on. Each device gets the job it is actually good at rather than the same layout rescaled.",
        "updated": "2026-09-17",
        "screens": [
          {
            "device": "phone",
            "file": "phone.html",
            "title": "Quick capture",
            "href": "systems/viewport-xr-v1/mockups/field-ar-v1/phone.html"
          },
          {
            "device": "ipad-portrait",
            "file": "ipad-portrait.html",
            "title": "Site brief",
            "href": "systems/viewport-xr-v1/mockups/field-ar-v1/ipad-portrait.html"
          },
          {
            "device": "ipad-landscape",
            "file": "ipad-landscape.html",
            "title": "Layer control",
            "href": "systems/viewport-xr-v1/mockups/field-ar-v1/ipad-landscape.html"
          }
        ],
        "devices": [
          "phone",
          "ipad-portrait",
          "ipad-landscape"
        ],
        "href": "systems/viewport-xr-v1/mockups/field-ar-v1/phone.html"
      }
    ]
  }
];

window.VP_SYSTEM_DEFAULT = "paper-v1";
