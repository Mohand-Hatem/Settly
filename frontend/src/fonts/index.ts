import localFont from "next/font/local";

/*
 * Self-hosted brand fonts (SIL Open Font License 1.1, sourced from Google Fonts).
 *
 * next/font/google downloads files from fonts.gstatic.com at dev start / build time and
 * silently substitutes a metric fallback (Arial) for the whole family if any request fails,
 * which happens on networks with unreliable Google connectivity. Committing the files makes
 * the build deterministic and offline-safe.
 *
 * Only the subsets the app uses are shipped (Latin for the Latin faces, Arabic for the
 * Arabic companions), with Google's unicode-range so the browser fetches a file only when
 * the page contains characters it covers. (next/font requires literal options, hence the
 * repeated range strings.)
 *
 * No `fallback` option: the generic families live at the end of the --display, --sans and
 * --mono-ui tokens in app/globals.css, after the Arabic companions.
 *
 * To add a weight or subset, download the woff2 from
 * https://fonts.googleapis.com/css2?family=... and declare it here.
 */

export const spectral = localFont({
  src: [
    { path: "./spectral-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./spectral-500-latin.woff2", weight: "500", style: "normal" },
    { path: "./spectral-600-latin.woff2", weight: "600", style: "normal" },
    { path: "./spectral-700-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-spectral",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

export const plusJakarta = localFont({
  src: "./plus-jakarta-sans-var-latin.woff2",
  weight: "200 800",
  variable: "--font-plus-jakarta",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

export const jetbrainsMono = localFont({
  src: "./jetbrains-mono-var-latin.woff2",
  weight: "100 800",
  variable: "--font-jetbrains-mono",
  display: "swap",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

// Arabic companions load on demand via unicode-range, so they are not preloaded
export const ibmPlexSansArabic = localFont({
  src: [
    { path: "./ibm-plex-sans-arabic-400-arabic.woff2", weight: "400", style: "normal" },
    { path: "./ibm-plex-sans-arabic-500-arabic.woff2", weight: "500", style: "normal" },
    { path: "./ibm-plex-sans-arabic-600-arabic.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC",
    },
  ],
});

export const notoNaskhArabic = localFont({
  src: "./noto-naskh-arabic-var-arabic.woff2",
  weight: "400 700",
  variable: "--font-noto-naskh-arabic",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC",
    },
  ],
});

export const fontVariables = [
  spectral.variable,
  plusJakarta.variable,
  jetbrainsMono.variable,
  ibmPlexSansArabic.variable,
  notoNaskhArabic.variable,
].join(" ");
