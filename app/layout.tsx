import type { Metadata } from "next";
import { Inter, Heebo } from "next/font/google";
import { TranslationsProvider } from "@/components/providers/TranslationsProvider";
import enMessages from "@/messages/en.json";
import esMessages from "@/messages/es.json";
import arMessages from "@/messages/ar.json";
import { DEPLOYMENT_LOCALE, LOCALE_HTML_LANG, isRtl } from "@/lib/i18n";
import "./globals.css";

const LOCALE_MESSAGES: Record<string, typeof enMessages> = {
  en: enMessages,
  es: esMessages,
  ar: arMessages,
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Newsprk – Newspaper WordPress Theme",
  description:
    "Do am he horrible distance marriage so throughout. Afraid assure square so happenmr an before. His many same been well can high that.",
  icons: {
    icon: "/uploads/2021/04/newsprk_dark.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = DEPLOYMENT_LOCALE;
  return (
    <html
      lang={LOCALE_HTML_LANG[locale]}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${inter.variable} ${heebo.variable}`}
    >
      <head>
        {/* Reference CSS cascade — exact order from ref-static index.htm <head> */}
        <link rel="stylesheet" href="/assets/css/plugins/widgets.min.css" />
        <link rel="stylesheet" href="/assets/css/plugins/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/plugins/animate.min.css" />
        <link rel="stylesheet" href="/assets/css/plugins/fontawesome.css" />
        <link rel="stylesheet" href="/assets/css/plugins/owl.carousel.css" />
        <link rel="stylesheet" href="/assets/css/plugins/slick.min.css" />
        <link rel="stylesheet" href="/assets/css/blog.min.css" />
        <link rel="stylesheet" href="/assets/css/master.min.css" />
        <link rel="stylesheet" href="/assets/css/elementor-widget.min.css" />
        {/* newsprk-elementor-widget-inline-css — reference position */}
        <style>{`
          body { background: #fcfcfc; }
          body { font-style: normal; font-size: 16px; font-weight: 400; }
          h1, h2 { font-style: normal; font-weight: 700; }
          h3 { font-style: normal; font-weight: 700; }
          h4, h5 { font-style: normal; font-weight: 700; }
          .footer { background: #17222b; }
          body .container,
          .elementor-section.elementor-section-boxed > .elementor-container {
            max-width: 1260px !important;
          }
          .elementor-section.elementor-section-boxed > .elementor-container {
            max-width: 1170px !important;
          }
        `}</style>
        {/* newsprk-woocommerce-style-css — ref position */}
        <link rel="stylesheet" href="/assets/css/woocommerce.css" />
        {/* elementor-icons-css — ref position, before frontend */}
        <link
          rel="stylesheet"
          href="/plugins/elementor/assets/lib/eicons/css/elementor-icons.min.css"
        />
        <link
          rel="stylesheet"
          href="/plugins/elementor/assets/css/frontend.min.css"
        />
        <link
          rel="stylesheet"
          href="/plugins/elementor/assets/lib/swiper/css/swiper.min.css"
        />
        <link rel="stylesheet" href="/plugins/elementor/css/post-5487.css" />
        <link rel="stylesheet" href="/plugins/elementor/css/post-6957.css" />
        <link rel="stylesheet" href="/assets/css/plugins/back_to_top.css" />
        {/* newsprk-back-to-top-inline-css — ref position */}
        <style>{`
          .newsprk-er-back-to-top {
            background: #54595f;
            color: #fff;
          }
        `}</style>
        {/* elementor-icons-shared-0 / elementor-icons-fa-brands — ref position */}
        <link
          rel="stylesheet"
          href="/plugins/elementor/assets/lib/font-awesome/css/fontawesome.min.css"
        />
        <link
          rel="stylesheet"
          href="/plugins/elementor/assets/lib/font-awesome/css/brands.min.css"
        />
        {/* wp-custom-css — after brands in ref cascade */}
        <link rel="stylesheet" href="/assets/css/wp-custom-css.css" />
        {/* late-injected (body-end) stylesheets — post-7094, social-buttons, subscriber, navigation — ref order */}
        <link rel="stylesheet" href="/plugins/elementor/css/post-7094.css" />
        <link
          rel="stylesheet"
          href="/plugins/element-ready/assets/css/widgets/social-buttons.css"
        />
        <link
          rel="stylesheet"
          href="/plugins/element-ready/assets/css/widgets/subscriber.css"
        />
        <link
          rel="stylesheet"
          href="/plugins/element-ready/assets/css/widgets/navigation.css"
        />
      </head>
      <body className="home page-template page-template-page-templates page-template-homepage page-template-page-templateshomepage-php page page-id-6957 theme-newsprk woocommerce-no-js sidebar-active woocommerce-active elementor-default elementor-kit-5487 elementor-page elementor-page-6957">
        <TranslationsProvider locale={locale} messages={LOCALE_MESSAGES[locale]}>{children}</TranslationsProvider>
      </body>
    </html>
  );
}