"use client";
import Link from "next/link";
import type { Category } from "@/types";
import Image from "next/image";
import { useTranslations } from "@/hooks/useTranslations";

interface Props {
  categories: Category[];
}

const SOCIAL_FEEDS: { textKey: string; linkKey: string; timeKey: string }[] = [
  {
    textKey: "socialFeed1Text",
    linkKey: "socialFeed1Link",
    timeKey: "socialFeed1Time",
  },
  {
    textKey: "socialFeed2Text",
    linkKey: "socialFeed2Link",
    timeKey: "socialFeed2Time",
  },
];

const RECENT_POSTS: { titleKey: string; image: string; dateKey: string; slugKey: string }[] = [
  {
    titleKey: "recentPost1Title",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=115&auto=format&fit=crop",
    dateKey: "recentPost1Date",
    slugKey: "recentPost1Slug",
  },
  {
    titleKey: "recentPost2Title",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=115&auto=format&fit=crop",
    dateKey: "recentPost2Date",
    slugKey: "recentPost2Slug",
  },
  {
    titleKey: "recentPost3Title",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=115&auto=format&fit=crop",
    dateKey: "recentPost3Date",
    slugKey: "recentPost3Slug",
  },
];

export default function Footer({ categories }: Props) {
  const tFooter = useTranslations("footer");
  const tCommon = useTranslations("common");

  return (
    <>
      <footer
        className="main-footer relative"
        style={{
          backgroundColor: "#1b1c26",
          backgroundImage: "url('/images/footer-bg.jpg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "90px 0 40px",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
        />

        <div
          className="mx-auto relative z-10"
          style={{ maxWidth: "1140px", padding: "0 12px" }}
        >
          {/* ═══ TOP SECTION ═══ */}
          <div
            className="flex flex-col md:grid md:gap-6 lg:grid-cols-[1fr_1.8fr_1.4fr] md:items-center"
          >
            {/* Logo */}
            <div className="mb-4 md:mb-0">
              <Link href="/" style={{ display: "flex", alignItems: "center" }}>
                <span className="font-black text-white tracking-tight leading-none" style={{ fontSize: "28px" }}>
                  {tCommon("siteName")}
                </span>
              </Link>
              <p className="mt-3 leading-relaxed" style={{ fontSize: "14px", color: "#a1a1aa", maxWidth: "280px" }}>
                {tFooter("deepDiveDescription")}
              </p>
            </div>
            {/* Description */}
            <div className="mb-4 md:mb-0">
              <p
                className="text-white mb-0 leading-relaxed"
                style={{ fontSize: "15px" }}
              >
                {tFooter("loremDescription")}
              </p>
            </div>

            {/* Newsletter Signup */}
            <div>
              <form className="flex flex-col md:flex-row items-center gap-2">
                <div style={{ flex: "1" }}>
                  <input
                    type="email"
                    placeholder={tFooter("emailPlaceholder")}
                    className="w-full px-3 py-2 text-sm outline-none text-black"
                    style={{ backgroundColor: "#fff", border: "none", width: "100%" }}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="text-white text-sm font-bold px-4 py-2 border-0 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#eb0254" }}
                  >
                    {tFooter("subscribe")}
                  </button>
                </div>
              </form>
              <p className="text-white mt-2" style={{ fontSize: "12px" }}>
                {tFooter("subscribeAgreement")}{" "}
                <Link
                  href="/privacy"
                  className="underline hover:text-white transition-colors"
                  style={{ color: "#eb0254" }}
                >
                  {tFooter("privacyPolicy")}
                </Link>
              </p>
            </div>
          </div>

          {/* ═══ DIVIDER ═══ */}
          <hr
            className="my-5"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          />

          {/* ═══ WIDGETS SECTION — 4 columns ═══ */}
          <div
            className="flex flex-col md:grid md:gap-6 lg:grid-cols-3"
          >
            {/* Col 1: Get My App (QR Code) */}
            {/*<div className="py-4 text-center">
              <div
                className="mx-auto"
                style={{
                  padding: "0 0 10px",
                  borderBottom: "2px solid #eb0254",
                  marginBottom: "20px",
                }}
              >
                <h5
                  style={{
                    color: "#fff",
                    fontSize: "17px",
                    fontWeight: 400,
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  {tFooter("getMyApp")}
                </h5>
              </div>
              <div className="inline-block bg-white mb-3 p-2">
                <div
                  style={{
                    width: "146px",
                    height: "146px",
                    backgroundColor: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src="/images/qr-code_trendsposts.png"
                    width={146}
                    height={146}
                    alt="QR Code"
                  />
                </div>
              </div>
              <p style={{ fontSize: "15px", color: "#fff" }}>
                {tFooter("scanQr")}
              </p>
            </div> */}

            {/* Col 2: Twitter feeds */}
            <div className="py-4 text-start">
              <div
                style={{
                  padding: "0 0 10px",
                  borderBottom: "2px solid #eb0254",
                  marginBottom: "20px",
                }}
              >
                <h5
                  style={{
                    color: "#fff",
                    fontSize: "17px",
                    fontWeight: 400,
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  {tFooter("twitterFeeds")}
                </h5>
              </div>
              <div className="space-y-5">
                {SOCIAL_FEEDS.map((feed, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: "15px",
                      lineHeight: "1.8em",
                      color: "#fff",
                    }}
                  >
                    {tFooter(feed.textKey)}
                    <div className="mt-1">
                      <a
                        href={tFooter(feed.linkKey)}
                        className="hover:underline"
                        style={{ color: "#eb0254" }}
                      >
                        {tFooter(feed.linkKey)}
                      </a>
                    </div>
                    <div
                      className="mt-2"
                      style={{ fontSize: "12px", color: "#888" }}
                    >
                      <i
                        className="fab fa-twitter ms-2"
                        style={{ color: "#eb0254" }}
                      />
                      {tFooter(feed.timeKey)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 3: Category */}
            <div className="py-4 text-center">
              <div
                className="mx-auto"
                style={{
                  padding: "0 0 10px",
                  borderBottom: "2px solid #eb0254",
                  marginBottom: "20px",
                }}
              >
                <h5
                  style={{
                    color: "#fff",
                    fontSize: "17px",
                    fontWeight: 400,
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  {tCommon("categories")}
                </h5>
              </div>
              <div
                className="mx-auto"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0 12px",
                  maxWidth: "280px",
                  margin: "0 auto",
                }}
              >
                <ul
                  className="list-none p-0 m-0"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {categories.slice(0, Math.ceil(categories.length / 2)).map((c) => (
                    <li
                      key={c.slug}
                      style={{
                        fontSize: "15px",
                        color: "#fff",
                        textAlign: "start",
                      }}
                    >
                      <Link
                        href={`/category/${c.slug}`}
                        className="hover:text-[#eb0254] transition-colors"
                        style={{ color: "#fff" }}
                      >
                        - {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <ul
                  className="list-none p-0 m-0"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {categories.slice(Math.ceil(categories.length / 2)).map((c) => (
                    <li
                      key={c.slug}
                      style={{
                        fontSize: "15px",
                        color: "#fff",
                        textAlign: "start",
                      }}
                    >
                      <Link
                        href={`/category/${c.slug}`}
                        className="hover:text-[#eb0254] transition-colors"
                        style={{ color: "#fff" }}
                      >
                        - {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Col 4: Recent Post */}
            <div className="py-4 text-start">
              <div
                style={{
                  padding: "0 0 10px",
                  borderBottom: "2px solid #eb0254",
                  marginBottom: "20px",
                }}
              >
                <h5
                  style={{
                    color: "#fff",
                    fontSize: "17px",
                    fontWeight: 400,
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  {tFooter("recentPost")}
                </h5>
              </div>
              <div>
                {RECENT_POSTS.map((post, i) => (
                  <div
                    key={i}
                    className="flex gap-3 pb-3 mb-3"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className="shrink-0 overflow-hidden relative"
                      style={{
                        width: "115px",
                        height: "85px",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={post.image}
                        alt={tFooter(post.titleKey)}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute bottom-0 flex items-center justify-center"
                        style={{
                          insetInlineEnd: 0,
                          backgroundColor: "#eb0254",
                          color: "#fff",
                          height: "20px",
                          width: "24px",
                          fontSize: "10px",
                        }}
                      >
                        <i className="fa fa-camera" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5
                        className="font-bold leading-tight mb-1 hover:text-[#eb0254] transition-colors cursor-pointer"
                        style={{
                          fontSize: "15px",
                          lineHeight: "22px",
                          color: "#fff",
                        }}
                      >
                        <a
                          href={`/article/${tFooter(post.slugKey)}`}
                          className="no-underline hover:text-[#eb0254]"
                          style={{ color: "#fff" }}
                        >
                          {tFooter(post.titleKey)}
                        </a>
                      </h5>
                      <span style={{ fontSize: "11px", color: "#888" }}>
                        {tFooter(post.dateKey)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ HOT TOPICS ═══ */}
          <div className="text-start mt-5">
            <h5
              style={{
                color: "#fff",
                fontSize: "17px",
                fontWeight: 400,
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              {tFooter("hotTopics")}
            </h5>
            <div className="flex flex-wrap" style={{ gap: "12px" }}>
              {categories.slice(0, 6).map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  style={{ fontSize: "15px", color: "#fff" }}
                  className="hover:text-[#eb0254] transition-colors"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ SUB FOOTER ═══ */}
      <div
        className="flex flex-col md:flex-row items-center justify-center"
        style={{
          backgroundColor: "#222327",
          padding: "15px 0",
        }}
      >
        <div
          className="mx-auto md:mx-0"
          style={{ maxWidth: "1140px", width: "100%", padding: "0 12px" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div style={{ color: "#fff", fontSize: "13px", textAlign: "center", marginBottom: "8px" }} className="md:mb-0">
              {tFooter("copyright")}
            </div>
            <ul
              className="list-none p-0 m-0 flex items-center justify-center flex-wrap"
              style={{ gap: "16px" }}
            >
              <li>
                <Link
                  href="/privacy"
                  style={{ color: "#fff", fontSize: "13px" }}
                  className="hover:text-[#eb0254] transition-colors"
                >
                  {tCommon("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  style={{ color: "#fff", fontSize: "13px" }}
                  className="hover:text-[#eb0254] transition-colors"
                >
                  {tCommon("contactUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/advertise"
                  style={{ color: "#fff", fontSize: "13px" }}
                  className="hover:text-[#eb0254] transition-colors"
                >
                  {tCommon("aboutUs")}
                </Link>
              </li>
              <li>
                <a
                  href="/donation"
                  style={{ color: "#fff", fontSize: "13px" }}
                  className="hover:text-[#eb0254] transition-colors"
                >
                  {tCommon("donation")}
                </a>
              </li>
              <li>
                <Link
                  href="/privacy"
                  style={{ color: "#fff", fontSize: "13px" }}
                  className="hover:text-[#eb0254] transition-colors"
                >
                  {tCommon("faq")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
