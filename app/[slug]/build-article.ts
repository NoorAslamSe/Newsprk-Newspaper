import { ARTICLE_HTML } from "./article-html";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(raw: any): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function bodyToElementor(bodyText: string): string {
  const paras = bodyText.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return paras
    .map(
      (p) =>
        '<section class="elementor-section elementor-top-section elementor-element elementor-section-boxed elementor-section-height-default elementor-section-height-default" data-element_type="section">' +
        '<div class="elementor-container elementor-column-gap-default">' +
        '<div class="elementor-column elementor-col-100 elementor-top-column elementor-element" data-element_type="column">' +
        '<div class="elementor-widget-wrap elementor-element-populated">' +
        '<div class="elementor-element elementor-widget elementor-widget-text-editor" data-element_type="widget" data-widget_type="text-editor.default">' +
        `<div class="elementor-widget-container"><p>${esc(p)}</p></div>` +
        "</div></div></div></div></section>"
    )
    .join("");
}

export function buildArticleHtml(a: any): string {
  let h = ARTICLE_HTML;

  const hero = a.articleMedia?.heroCoverMedia?.url || "";
  const categoryHref = a.category ? `/category/${encodeURIComponent(a.category)}/` : "#";
  const categoryLabel = a.categoryLabel || a.category || "News";
  const dateStr = formatDate(a.date);
  const views = a.views != null ? String(a.views) : "0";
  const excerpt = a.excerpt || "";
  const content = a.bodyContent ? bodyToElementor(a.bodyContent) : a.bodyHtml || "";

  const fill: [string, string][] = [
    ["__ARTICLE_TITLE__", esc(a.title)],
    ["__ARTICLE_EXCERPT__", esc(excerpt)],
    ["__ARTICLE_CAT_URL__", esc(categoryHref)],
    ["__ARTICLE_CAT_LABEL__", esc(categoryLabel)],
    ["__ARTICLE_META_DATE__", esc(dateStr)],
    ["__ARTICLE_META_VIEWS__", esc(views)],
    ["__ARTICLE_HERO_SRC__", esc(hero)],
    ["__ARTICLE_HERO_ALT__", esc(a.title)],
    ["__ARTICLE_AUTHOR_NAME__", esc(a.authorName || "TrendsPosts")],
    ["__ARTICLE_AUTHOR_DATE__", esc(dateStr)],
    ["__ARTICLE_CONTENT__", content],
  ];

  for (const [token, value] of fill) h = h.split(token).join(value);

  if (!hero) {
    h = h.replace(/<div class="video_img">[\s\S]*?<\/div>/, "");
  }

  if (h.includes("__ARTICLE_")) {
    throw new Error("Unfilled article sentinel remains in template");
  }
  return h;
}