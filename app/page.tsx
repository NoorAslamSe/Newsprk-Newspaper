import SiteScripts from "@/components/SiteScripts";
import { HOMEPAGE_HTML } from "./homepage-html";
import { buildPostsMenu } from "@/lib/posts-menu";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const html = await buildPostsMenu(HOMEPAGE_HTML);
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <SiteScripts />
    </>
  );
}