import React from "react";
import "./BrandLogo.css";

export default function BrandLogo({ className = "", alt = "CodeIt" }) {
  return (
    <span className={["brand-logo", className].filter(Boolean).join(" ")}>
      {/* 512 wide: twice the largest size the logo is ever shown at. The
          full-size file (984 wide, 53 KB) was being sent to every phone to be
          drawn 256 wide. The width and height keep its place on the page
          before it arrives. */}
      <img src="/brand/codeit-logo-512.png" alt={alt} width="512" height="340" />
    </span>
  );
}
