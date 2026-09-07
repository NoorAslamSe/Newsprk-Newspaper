import SiteScripts from "@/components/SiteScripts";
import { HOMEPAGE_HTML } from "./homepage-html";
import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Original submenu slot IDs, reused 1:1 so per-item anchors keep their hooks;
// extra posts (beyond the original slots) get generated IDs.
const MENU_SLOT_IDS = [
  5280, 5284, 5286, 5281, 5272, 5291, 5289, 5274, 5282, 5285, 5287,
];

// Note: titles are admin-provided HTML (as elsewhere on the site) and may
// contain entity references such as `&#8216;`; they're inserted raw so the
// entity renders as the intended character instead of being double-encoded.

/**
 * Renders the header "Posts" dropdown menus (desktop + mobile) from MongoDB.
 * The original submenus (General/Video/Audio/Sidebar) are dropped; every
 * published post is listed directly with its real title and slug, so posts
 * added in the dashboard automatically appear in the menu. Falls back to the
 * original static block whenever the DB is unreachable or has no posts.
 */
async function buildPostsMenu(html: string): Promise<string> {
  let posts: Array<{ slug: string; title: string }> = [];
  try {
    await connectDB();
    posts = await Article.find({
      status: "published",
      locale: DEPLOYMENT_LOCALE,
    })
      .sort({ date: -1 })
      .select("slug title")
      .lean();
  } catch (error) {
    console.error("Error building posts menu from DB:", error);
  }
  posts = posts.filter((a) => a.slug && a.title);
  if (posts.length === 0) return html;

  const itemId = (i: number) =>
    MENU_SLOT_IDS[i] ?? 6000 + (i - MENU_SLOT_IDS.length);

  // Desktop nav item markup (keeps the reference `nav-item dropdown` classes)
  const desktopItems = posts
    .map(
      (p, i) =>
        `\t<li id="menu-item-${itemId(i)}" class="menu-item menu-item-type-post_type menu-item-object-post menu-item-${itemId(i)} nav-item"><a href="/${p.slug}/" class=" dropdown-item">${titleMarkup(p.title)}</a>\t`
    )
    .join("");

  // Desktop nav: the Posts dropdown is li#menu-item-3152, directly followed
  // by the "Categores" li#menu-item-3151.
  const dStart = html.indexOf('<li id="menu-item-3152"');
  if (dStart === -1) return html;
  const dEnd = html.indexOf('<li id="menu-item-3151"', dStart);
  if (dEnd === -1) return html;

  const desktopBlock = `<li id="menu-item-3152" class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-3152 nav-item dropdown"><a href="#" class="nav-link has-child dropdown-toggle" data-toggle="dropdown">Posts</a>\n<ul class="dropdown-menu">\n${desktopItems}</ul>\n</li>\n`;
  html = html.slice(0, dStart) + desktopBlock + html.slice(dEnd);

  // Mobile offcanvas nav item markup (uses `sub-menu` classes, wrapped li)
  const mobileItems = posts
    .map(
      (p, i) =>
        `\t\t<li class="menu-item menu-item-type-post_type menu-item-object-post menu-item-${itemId(i)}"><a href="/${p.slug}/">${titleMarkup(p.title)}</a></li>\n`
    )
    .join("");

  // Mobile nav: the Posts dropdown is menu-item-3152 (no id attr), followed
  // by the mobile "Categores" menu-item-3151 list item.
  const mStart = html.indexOf(
    '<li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-3152"><a href="#">Posts</a>'
  );
  if (mStart !== -1) {
    const mEnd = html.indexOf(
      '<li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-3151">',
      mStart
    );
    if (mEnd !== -1) {
      const mobileBlock = `<li class="menu-item menu-item-type-custom menu-item-object-custom menu-item-has-children menu-item-3152"><a href="#">Posts</a>\n<ul class="sub-menu">\n${mobileItems}</ul>\n</li>\n\t`;
      html = html.slice(0, mStart) + mobileBlock + html.slice(mEnd);
    }
  }

  return html;
}

export default async function HomePage() {
  const html = await buildPostsMenu(HOMEPAGE_HTML);
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <SiteScripts />
    </>
  );
}