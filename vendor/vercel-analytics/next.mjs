import { Fragment, createElement } from "react";
import Script from "next/script";

export function Analytics() {
  return createElement(
    Fragment,
    null,
    createElement(Script, { defer: true, src: "/_vercel/insights/script.js" }),
    createElement(
      Script,
      { id: "vercel-analytics-init", strategy: "afterInteractive" },
      "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };"
    )
  );
}
