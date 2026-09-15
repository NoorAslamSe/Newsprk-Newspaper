import SiteScripts from "@/components/SiteScripts";
import { HOMEPAGE_HTML } from "./homepage-html";
import { buildPostsMenu } from "@/lib/posts-menu";
import { buildHomepagePosts } from "@/lib/homepage-posts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let html = await buildPostsMenu(HOMEPAGE_HTML);
  html = await buildHomepagePosts(html);
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <SiteScripts />
    </>
  );
}