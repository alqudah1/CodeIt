import { useEffect } from "react";
import PAGE_META from "../data/pageMeta";

const BASE_URL = "https://codeitlearn.com";
const DEFAULT_IMAGE = `${BASE_URL}/brand/og-image.png`;

const DEFAULTS = {
  title: "Coding for Kids: Build Websites & Learn the Code | CodeIt",
  // Not "edit the code behind each project". This default is what any page
  // without its own entry shows, so a false claim here is a false claim on
  // whichever page forgets to say otherwise.
  description: "CodeIt is a browser-based coding studio built for ages 8 to 14. Describe a website, game or quiz, change it by moving things and picking colours, then see what it is made of. Younger children can use it alongside an adult.",
  canonical: "/",
  image: DEFAULT_IMAGE,
};

export function useSEO({ title, description, canonical, image, robots = "index,follow" } = {}) {
  useEffect(() => {
    const resolvedCanonical = canonical ?? DEFAULTS.canonical;

    // A page passes its canonical and nothing else. The title and description
    // for that route live in src/data/pageMeta.js, which the static generator
    // reads too, so the two cannot drift apart. An explicit title or
    // description still wins, for the pages whose text is built at runtime.
    const meta = PAGE_META[resolvedCanonical] || {};
    const resolvedTitle = title ?? meta.title ?? DEFAULTS.title;
    const resolvedDescription = description ?? meta.description ?? DEFAULTS.description;
    const resolvedImage = image
      ? (image.startsWith("http") ? image : `${BASE_URL}${image}`)
      : DEFAULTS.image;
    const fullUrl = `${BASE_URL}${resolvedCanonical}`;

    document.title = resolvedTitle;
    setMeta("name", "description", resolvedDescription);
    setMeta("property", "og:title", resolvedTitle);
    setMeta("property", "og:description", resolvedDescription);
    setMeta("property", "og:url", fullUrl);
    setMeta("property", "og:image", resolvedImage);
    setMeta("name", "twitter:title", resolvedTitle);
    setMeta("name", "twitter:description", resolvedDescription);
    setMeta("name", "twitter:image", resolvedImage);
    setMeta("name", "robots", robots);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = fullUrl;

    return () => {
      document.title = DEFAULTS.title;
      setMeta("name", "description", DEFAULTS.description);
      setMeta("property", "og:title", DEFAULTS.title);
      setMeta("property", "og:description", DEFAULTS.description);
      setMeta("property", "og:url", BASE_URL);
      setMeta("property", "og:image", DEFAULTS.image);
      setMeta("name", "twitter:title", DEFAULTS.title);
      setMeta("name", "twitter:description", DEFAULTS.description);
      setMeta("name", "twitter:image", DEFAULTS.image);
      setMeta("name", "robots", "index,follow");
      const link = document.querySelector('link[rel="canonical"]');
      if (link) link.href = `${BASE_URL}/`;
    };
  }, [title, description, canonical, image, robots]);
}

function setMeta(attribute, value, content) {
  let element = document.querySelector(`meta[${attribute}="${value}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}
