"use client";

import { useEffect } from "react";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

// Mirrors newsprk_slider_controls() from elementor.min.js
function sliderControls(controls: Record<string, any>) {
  const o: Record<string, any> = {
    newsprk_slider_autoplay: true,
    newsprk_slider_loop: false,
    newsprk_slider_autoplay_hover_pause: false,
    newsprk_slider_autoplay_timeout: 5000,
    newsprk_slider_dot_nav_show: false,
    newsprk_slider_items: 3,
    newsprk_slider_items_mobile: 1,
    newsprk_slider_items_tablet: 2,
    newsprk_slider_margin: 5,
    newsprk_slider_nav_show: false,
    newsprk_slider_smart_speed: 250,
  };
  if ("newsprk_slider_autoplay" in controls)
    o.newsprk_slider_autoplay = controls.newsprk_slider_autoplay === "yes";
  if ("newsprk_slider_loop" in controls)
    o.newsprk_slider_loop = controls.newsprk_slider_loop === "yes";
  if ("newsprk_slider_autoplay_hover_pause" in controls)
    o.newsprk_slider_autoplay_hover_pause =
      controls.newsprk_slider_autoplay_hover_pause === "yes";
  if ("newsprk_slider_dot_nav_show" in controls)
    o.newsprk_slider_dot_nav_show = controls.newsprk_slider_dot_nav_show === "yes";
  if ("newsprk_slider_nav_show" in controls)
    o.newsprk_slider_nav_show = controls.newsprk_slider_nav_show === "yes";
  if ("newsprk_slider_autoplay_timeout" in controls)
    o.newsprk_slider_autoplay_timeout = parseInt(controls.newsprk_slider_autoplay_timeout);
  if ("newsprk_slider_items" in controls)
    o.newsprk_slider_items = parseInt(controls.newsprk_slider_items || "1");
  if ("newsprk_slider_items_mobile" in controls)
    o.newsprk_slider_items_mobile = parseInt(controls.newsprk_slider_items_mobile || "1");
  if ("newsprk_slider_items_tablet" in controls)
    o.newsprk_slider_items_tablet = parseInt(controls.newsprk_slider_items_tablet || "1");
  if ("newsprk_slider_margin" in controls)
    o.newsprk_slider_margin = controls.newsprk_slider_margin || "10";
  if ("newsprk_slider_smart_speed" in controls)
    o.newsprk_slider_smart_speed = controls.newsprk_slider_smart_speed || "250";
  return o;
}

export default function SiteScripts() {
  useEffect(() => {
    let cancelled = false;
    let cleanupFns: Array<() => void> = [];

    const init = async () => {
      await loadScript("/vendor/jquery.min.js");
      await loadScript("/vendor/jquery-migrate.min.js");
      await loadScript("/vendor/owl.carousel.min.js");
      const $ = (window as any).jQuery;
      if (!window.jQuery.fn.owlCarousel) return;
      await loadScript("/vendor/circle-progress.min.js").catch(() => {});

      const navText = [
        "<i class='fal fa-angle-left'></i>",
        "<i class='fal fa-angle-right'></i>",
      ];

      // ----- Hero + content carousels (newsprk-slider style, via data-controls) -----
      const initCarousel = (el: HTMLElement) => {
        let controls: Record<string, any> = {};
        const raw = el.getAttribute("data-controls");
        if (raw) {
          try {
            controls = JSON.parse(raw);
          } catch (e) {
            controls = {};
          }
        }
        const c = sliderControls(controls);
        window.jQuery(el).owlCarousel({
          loop: c.newsprk_slider_loop,
          autoplay: c.newsprk_slider_autoplay,
          nav: c.newsprk_slider_nav_show,
          autoplayTimeout: c.newsprk_slider_autoplay_timeout,
          autoplayHoverPause: c.newsprk_slider_autoplay_hover_pause,
          margin: Number(c.newsprk_slider_margin) || 0,
          navText,
          smartSpeed: Number(c.newsprk_slider_smart_speed) || 250,
          responsive: {
            0: { items: c.newsprk_slider_items_mobile },
            600: { items: c.newsprk_slider_items_tablet },
            1000: { items: c.newsprk_slider_items },
          },
        });
      };

      const hero = document.querySelector<HTMLElement>(".carousel_posts1.post__slider__style__1");
      document.querySelectorAll<HTMLElement>(".owl-carousel[data-controls]").forEach((el) => {
        if (el === hero) return;
        initCarousel(el);
      });
      if (hero) initCarousel(hero);

      // ----- Topbar trancarousel (main.min.js; settings from newsprk_obj.newsticker_slider) -----
      const tc = document.querySelector<HTMLElement>(".trancarousel");
      if (tc) {
        window.jQuery(tc).owlCarousel({
          loop: true,
          nav: true,
          autoplayHoverPause: true,
          autoplay: true,
          autoplayTimeout: 3000,
          items: 1,
          smartSpeed: 3000,
          margin: 30,
          navText,
        });
      }

      // ----- Slick hero slider (Widget_Slick_Slider in elementor.min.js) -----
      Promise.resolve(loadScript("/vendor/slick.min.js"))
        .then(() => {
          if (!(window as any).jQuery.fn.slick) return;
          const doSlick = () => {
            const scope = document.querySelector<HTMLElement>(
              '[data-widget_type="newsprk-slick-post-slider.default"]'
            );
            if (!scope) return;
            const $scope = window.jQuery(scope);
            const $container2 = $scope.find(".slider_demo2");
            if (!$container2.length) return;
            const number = parseInt($container2.data("number")) || 0;
            const numberTablet = parseInt($container2.data("number_tablet")) || 0;
            const numberMobile = parseInt($container2.data("number_mobile")) || 0;
            const autoplay = Boolean($container2.data("autoplay"));
            const speed = parseInt($container2.data("speed")) || 0;
            const $container1 = $scope.find(".slider_demo1");
            $container2.slick({
              rtl: Boolean((window as any).newsprk_essential_obj?.is_rtl),
              slidesToShow: 1,
              slidesToScroll: 1,
              arrows: false,
              speed,
              autoplay,
              fade: true,
              asNavFor: $container1,
            });
            $container1.slick({
              rtl: Boolean((window as any).newsprk_essential_obj?.is_rtl),
              slidesToShow: number,
              slidesToScroll: 1,
              asNavFor: $container2,
              speed,
              dots: false,
              prevArrow:
                "<div class='slider_arrow arrow_left'><i class='fal fa-angle-left'></i></div>",
              nextArrow:
                "<div class='slider_arrow arrow_right'><i class='fal fa-angle-right'></i></div>",
              centerMode: true,
              focusOnSelect: true,
              responsive: [
                { breakpoint: 1024, settings: { slidesToShow: number, slidesToScroll: 1, infinite: true } },
                { breakpoint: 990, settings: { slidesToShow: numberTablet, slidesToScroll: 1 } },
                { breakpoint: 420, settings: { slidesToShow: numberMobile, slidesToScroll: 1 } },
              ],
            });
          };
          if (document.readyState === "complete") doSlick();
          else window.addEventListener("load", doSlick);
        })
        .catch(() => {});

      // ----- Sports circle progress (Widget_Sports in elementor.min.js) -----
      if ((window as any).jQuery.fn.circleProgress) {
        const sportsScope = document.querySelector<HTMLElement>(
          '[data-widget_type="newsprk-sports.default"]'
        );
        const matchWrap = sportsScope?.querySelector<HTMLElement>(".upcomming_macth");
        const empty = matchWrap?.getAttribute("data-empty") || "#e2e2e2";
        const fill = matchWrap?.getAttribute("data-fill") || "#ff5555";
        document.querySelectorAll<HTMLElement>(".circle").forEach((el) => {
          const progress_value = Number(el.getAttribute("data-value")) || 0;
          window.jQuery(el).circleProgress({
            startAngle: (-Math.PI / 4) * 3,
            value: progress_value,
            size: 36,
            thickness: 4,
            lineCap: "round",
            emptyFill: empty,
            fill: { color: fill },
          });
        });
      }

      // ----- Search toggle (main.min.js) -----
      const searchBtn = document.querySelector(".search_btn");
      const closeBtn = document.querySelector(".close_btn");
      const searching = document.querySelector(".searching");
      const onSearch = () => searching?.classList.add("active");
      const offSearch = () => searching?.classList.remove("active");
      if (searchBtn && searching) {
        searchBtn.addEventListener("click", onSearch);
        cleanupFns.push(() => searchBtn.removeEventListener("click", onSearch));
      }
      if (closeBtn && searching) {
        closeBtn.addEventListener("click", offSearch);
        cleanupFns.push(() => closeBtn.removeEventListener("click", offSearch));
      }

      // ----- Offcanvas mobile menu (main.min.js) -----
      const openTrig = document.getElementById("offcanvas__menu__open__trigger");
      const closeTrig = document.getElementById("offcanvas__menu__close__trigger");
      const menuWrap = document.getElementById("offcanvas__mobile__menu__main__wrapper");
      if (openTrig?.nextElementSibling !== menuWrap) {
        // add active handling
        const onOpen = () => {
          menuWrap?.classList.remove("inactive");
          menuWrap?.classList.add("active");
        };
        const onClose = () => {
          menuWrap?.classList.remove("active");
          menuWrap?.classList.add("inactive");
        };
        openTrig?.addEventListener("click", onOpen);
        closeTrig?.addEventListener("click", onClose);
        cleanupFns.push(() => openTrig?.removeEventListener("click", onOpen));
        cleanupFns.push(() => closeTrig?.removeEventListener("click", onClose));
      }

      // ----- Sticky header (main.min.js + newsprk-sticky) -----
      const stickyEl = document.querySelector(".newsprk-sticky");
      const onScroll = () => {
        if (window.scrollY > 220) stickyEl?.classList.add("sticky");
        else stickyEl?.classList.remove("sticky");
      };
      window.addEventListener("scroll", onScroll);
      cleanupFns.push(() => window.removeEventListener("scroll", onScroll));

      // ----- Back to top (back_to_top.js) -----
      const btt = document.querySelector(".newsprk-er-back-to-top");
      const onScrollBtt = () => {
        if (window.scrollY > 500) window.jQuery(btt).fadeIn(200);
        else window.jQuery(btt).fadeOut(200);
      };
      window.addEventListener("scroll", onScrollBtt);
      cleanupFns.push(() => window.removeEventListener("scroll", onScrollBtt));
      const onBttClick = (e: Event) => {
        e.preventDefault();
        window.scrollTo(0, 0);
        return false;
      };
      if (btt) {
        btt.addEventListener("click", onBttClick);
        cleanupFns.push(() => btt.removeEventListener("click", onBttClick));
      }

      // ----- dropdown-toggle bootstrap behavior -----
      document.querySelectorAll<HTMLElement>("[data-toggle='dropdown']").forEach((el) => {
        const parent = el.closest(".dropdown");
        const menu = parent?.querySelector(".dropdown-menu");
        const handler = (e: Event) => {
          e.preventDefault();
          if (!parent || !menu) return;
          const open = parent.classList.contains("show");
          document.querySelectorAll(".dropdown.show").forEach((d) => {
            d.classList.remove("show");
            d.querySelector(".dropdown-menu")?.classList.remove("show");
          });
          if (!open) {
            parent.classList.add("show");
            menu.classList.add("show");
          }
        };
        el.addEventListener("click", handler);
        cleanupFns.push(() => el.removeEventListener("click", handler));
      });
      document.querySelectorAll<HTMLElement>(".dropdown-menu").forEach((menu) => {
        menu.parentElement?.addEventListener("mouseenter", () => {
          menu.parentElement?.classList.add("show");
          menu.classList.add("show");
        });
        menu.parentElement?.addEventListener("mouseleave", () => {
          menu.parentElement?.classList.remove("show");
          menu.classList.remove("show");
        });
      });

      // StellarNav-style mobile nav: submenu toggle (main.min.js offcanvas logic)
      document.querySelectorAll<HTMLElement>(".offcanvas__navigation li.menu-item-has-children > a").forEach((a) => {
        const li = a.parentElement!;
        const sub = li.querySelector(":scope > ul.sub-menu");
        if (!sub) return;
        const expand = document.createElement("span");
        expand.className = "menu-expand";
        expand.innerHTML = "<i></i>";
        li.appendChild(expand);
        const handler = (e: Event) => {
          e.preventDefault();
          li.classList.toggle("active");
          if (sub) {
            const open = (sub as HTMLElement).style.display === "block";
            (sub as HTMLElement).style.display = open ? "" : "block";
          }
        };
        expand.addEventListener("click", handler);
        cleanupFns.push(() => expand.removeEventListener("click", handler));
      });
    };

    init().catch((e) => console.error("SiteScripts init failed:", e));
    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
      cleanupFns = [];
    };
  }, []);

  return null;
}