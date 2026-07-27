import React from "react";
import "./BrandLogo.css";

export default function BrandLogo({ className = "", alt = "CodeIt" }) {
  return (
    <span className={["brand-logo", className].filter(Boolean).join(" ")}>
      <img src="/brand/codeit-logo-trimmed.png" alt={alt} />
    </span>
  );
}
