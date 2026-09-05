"use client";

import { useEffect } from "react";
import SiteScripts from "@/components/SiteScripts";
import { ASDA_HTML } from "../asda-html";

export default function AsdaPost() {
  useEffect(() => {
    const prev = document.body.className;
    document.body.className =
      "post-template-default single single-post postid-5225 single-format-standard theme-newsprk woocommerce-no-js sidebar-active woocommerce-active elementor-default elementor-kit-5487 elementor-page elementor-page-5225";
    return () => {
      document.body.className = prev;
    };
  }, []);

  return (
    <>
      <link rel="stylesheet" href="/plugins/elementor/css/post-5225.css" />
      <div dangerouslySetInnerHTML={{ __html: ASDA_HTML }} />
      <SiteScripts />
    </>
  );
}