import SiteScripts from "@/components/SiteScripts";
import { HOMEPAGE_HTML } from "./homepage-html";

export default function HomePage() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: HOMEPAGE_HTML }} />
      <SiteScripts />
    </>
  );
}