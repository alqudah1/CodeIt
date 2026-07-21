import { useEffect } from "react";

const BASE_URL = "https://codeitlearn.com";
const DEFAULT_IMAGE = `${BASE_URL}/brand/og-image.png`;

const DEFAULTS = {
  title: "AI Coding for Kids: Build Websites & Learn the Code | CodeIt",
  description: "CodeIt helps kids and beginner coders build websites, games, and quizzes with AI, then understand and edit the code behind each project.",
  canonical: "/",
  image: DEFAULT_IMAGE,
};

export function useSEO({ title, description, canonical, image } = {}) {
  useEffect(() => {
    const resolvedTitle = title ?? DEFAULTS.title;
    const resolvedDescription = description ?? DEFAULTS.description;
    const resolvedCanonical = canonical ?? DEFAULTS.canonical;
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
      const link = document.querySelector('link[rel="canonical"]');
      if (link) link.href = `${BASE_URL}/`;
    };
  }, [title, description, canonical, image]);
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
