import { connectDB } from "@/lib/db";
import { Article } from "@/lib/models/Article";
import { DEPLOYMENT_LOCALE } from "@/lib/i18n";

interface Slot {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryLabel: string;
  dateFmt: string;
  datePath: string;
}

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const fmtPath = (d: string | Date) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;
};

const strip = (s: string) => (s || "").replace(/<[^>]*>/g, "").trim();
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function buildHomepagePosts(html: string): Promise<string> {
  let rows: any[] = [];
  try {
    await connectDB();
    rows = await Article.find({
      status: "published",
      locale: DEPLOYMENT_LOCALE,
    })
      .sort({ date: -1 })
      .select("slug title excerpt category categoryLabel date")
      .lean();
  } catch (e) {
    console.error("buildHomepagePosts: DB error", e);
    return html;
  }
  if (!rows.length) return html;

  const pool: Slot[] = rows.map((a) => ({
    slug: a.slug,
    title: a.title || "",
    excerpt: strip(a.excerpt || "").slice(0, 200),
    category: a.category || "",
    categoryLabel: a.categoryLabel || a.category || "",
    dateFmt: fmtDate(a.date),
    datePath: fmtPath(a.date),
  }));

  const dbSlugs = new Set(pool.map((s) => s.slug));

  const seen: string[] = [];
  const re = /href="\/([a-z0-9]+(?:-[a-z0-9]+){2,})\/"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const slug = m[1];
    if (
      !slug.startsWith("home-") &&
      !dbSlugs.has(slug) &&
      !seen.includes(slug)
    ) {
      seen.push(slug);
    }
  }

  const old2new = new Map<string, Slot>();
  const slug2art = new Map<string, Slot>();
  seen.forEach((old, i) => {
    const a = pool[i % pool.length];
    old2new.set(old, a);
    slug2art.set(a.slug, a);
  });

  for (const [old, a] of old2new) {
    html = html.split(`href="/${old}/"`).join(`href="/${a.slug}/"`);
  }

  html = html.replace(
    /<h4>\s*<a href="\/([^"]+)\/">[\s\S]*?<\/a>\s*<\/h4>/gi,
    (match, slug) => {
      const a = slug2art.get(slug);
      if (!a) return match;
      return match.replace(
        /(<h4>\s*<a href="\/[^"]+\/">)\s*[\s\S]*?\s*(<\/a>\s*<\/h4>)/i,
        `$1 ${esc(a.title)} $2`,
      );
    },
  );

  html = html.replace(
    /(<div class="trancarousel_item">\s*)<a href="\/([^"]+)\/">[\s\S]*?<\/a>\s*(<\/div>)/gi,
    (_match, pre: string, slug: string, post: string) => {
      const a = slug2art.get(slug);
      if (!a) return _match;
      return `${pre}<a href="/${a.slug}/"> ${esc(a.title)} </a>${post}`;
    },
  );

  const h4Idx: { pos: number; slug: string }[] = [];
  const h4Re = /<h4>\s*<a href="\/([^"]+)\/">/gi;
  let hm: RegExpExecArray | null;
  while ((hm = h4Re.exec(html)) !== null) {
    if (slug2art.has(hm[1])) h4Idx.push({ pos: hm.index, slug: hm[1] });
  }

  const near = (pos: number): Slot | null => {
    let best: { slug: string } | null = null;
    let bestD = Infinity;
    for (const h of h4Idx) {
      const d = Math.abs(h.pos - pos);
      if (d < bestD) {
        bestD = d;
        best = h;
      }
    }
    return best && bestD < 3000 ? slug2art.get(best.slug) || null : null;
  };

  const next = (pos: number): Slot | null => {
    let best: { slug: string } | null = null;
    let bestD = Infinity;
    for (const h of h4Idx) {
      const d = h.pos - pos;
      if (d >= 0 && d < bestD) {
        bestD = d;
        best = h;
      }
    }
    return best && bestD < 3000 ? slug2art.get(best.slug) || null : null;
  };

  html = html.replace(
    /<div class="meta[^"]*"[^>]*>[\s\S]*?<a\s+class="cat"\s+href="\/category\/([^"]*)"[^>]*>\s*([^<]*)\s*<\/a>/gi,
    (match, _cat, _label, off: number) => {
      const a = near(off);
      if (!a) return match;
      return match
        .replace(/href="\/category\/[^"]*"/, `href="/category/${a.category}/"`)
        .replace(/>[^<]*<\/a>/, `>${esc(a.categoryLabel)}</a>`);
    },
  );

  html = html.replace(
    /(<p class="meta">[\s\S]*?)<a\s+href="\/category\/([^"]*)"[^>]*>\s*([^<]*)\s*<\/a>/gi,
    (match, _prefix, _cat, _label, off: number) => {
      const a = near(off);
      if (!a) return match;
      return match
        .replace(/href="\/category\/[^"]*"/, `href="/category/${a.category}/"`)
        .replace(/>[^<]*<\/a>/, `>${esc(a.categoryLabel)}</a>`);
    },
  );

  html = html.replace(
    /<a\s+class="date"\s+href="\/[^"]*"[^>]*>\s*([^<]*)\s*<\/a>/gi,
    (match, _oldDate, off: number) => {
      const a = near(off);
      if (!a) return match;
      return match
        .replace(/href="\/[^"]*"/, `href="/${a.datePath}/"`)
        .replace(/>\s*[^<]*\s*<\/a>/, `>  ${a.dateFmt}  </a>`);
    },
  );

  html = html.replace(
    /(<p class="meta">[\s\S]*?<a href="\/category\/[^"]*"[^>]*>[^<]*<\/a>\s*)<span>\s*([^<]*)\s*<\/span>/gi,
    (match, _prefix, _oldDate, off: number) => {
      const a = near(off);
      if (!a) return match;
      return `${_prefix}<span>  ${a.dateFmt}  </span>`;
    },
  );

  html = html.replace(
    /<p class="post-p">\s*([^<]*)\s*<\/p>/gi,
    (match, _old, off: number) => {
      const a = near(off);
      if (!a || !a.excerpt) return match;
      return `<p class="post-p"> ${esc(a.excerpt)} </p>`;
    },
  );

  html = html.replace(
    /(<div class="post_img[^"]*"[^>]*>[\s\S]*?)<img[^>]*alt="[^"]*"[^>]*>/gi,
    (match, _prefix, off: number) => {
      const a = next(off);
      if (!a) return match;
      return match.replace(/alt="[^"]*"/, `alt="${esc(a.title)}"`);
    },
  );

  return html;
}
