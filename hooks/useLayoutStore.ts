"use client";
import { create } from "zustand";
import { isRtl, DEPLOYMENT_LOCALE } from "@/lib/i18n";

type Direction = "ltr" | "rtl";

interface LayoutState {
  direction: Direction;
}

function applyDirection(dir: Direction) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const body = document.body;

  html.setAttribute("dir", dir);
  html.setAttribute("lang", dir === "rtl" ? "ar" : "en");

  if (dir === "rtl") {
    body.classList.add("layout-rtl");
  } else {
    body.classList.remove("layout-rtl");
  }
}

export const useLayoutStore = create<LayoutState>(() => ({
  direction: isRtl(DEPLOYMENT_LOCALE) ? "rtl" : "ltr",
}));

export function initLayout() {
  if (typeof document === "undefined") return;
  const dir: Direction = isRtl(DEPLOYMENT_LOCALE) ? "rtl" : "ltr";
  applyDirection(dir);
  useLayoutStore.setState({ direction: dir });
}
