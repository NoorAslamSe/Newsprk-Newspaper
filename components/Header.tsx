"use client";

import { useState } from "react";
import Link from "next/link";
import { trendingPosts, menuItems } from "@/lib/data";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [trendingIndex, setTrendingIndex] = useState(0);

  const prevTrending = () =>
    setTrendingIndex((prev) => (prev - 1 + trendingPosts.length) % trendingPosts.length);
  const nextTrending = () =>
    setTrendingIndex((prev) => (prev + 1) % trendingPosts.length);

  return (
    <>
      {/* Top Bar */}
      <div className="topbar">
        <div className="container">
          <div className="row" style={{ alignItems: "center" }}>
            <div style={{ flex: "0 0 66.667%", maxWidth: "66.667%", padding: "0 15px" }}>
              <div className="trancarousel_area">
                <span className="trand">Trending</span>
                <div className="trancarousel owl-carousel nav_style1">
                  <div className="trancarousel_item">
                    <a href="#">{trendingPosts[trendingIndex]}</a>
                  </div>
                  <div className="owl-nav">
                    <div className="owl-prev" onClick={prevTrending}>&lt;</div>
                    <div className="owl-next" onClick={nextTrending}>&gt;</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: "0 0 33.333%", maxWidth: "33.333%", padding: "0 15px" }}>
              <div className="top_date_social" style={{ justifyContent: "flex-end" }}>
                <div className="paper_date">
                  <div>September 1, 2026</div>
                </div>
                <div className="social1">
                  <ul className="inline">
                    <li><a href="#"><i className="fab fa-facebook-f"></i></a></li>
                    <li><a href="#"><i className="fab fa-twitter"></i></a></li>
                    <li><a href="#"><i className="fab fa-youtube"></i></a></li>
                    <li><a href="#"><i className="fab fa-pinterest-p"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border_black"></div>

      {/* Search Overlay */}
      <div className={`searching ${searchOpen ? "active" : ""}`}>
        <div className="container">
          <div className="row">
            <div style={{ flex: "0 0 66.667%", maxWidth: "66.667%", padding: "0 15px", margin: "0 auto", textAlign: "center" }}>
              <div className="v1search_form">
                <form>
                  <input type="search" placeholder="Search here" />
                  <button type="button" className="cbtn1" onClick={() => setSearchOpen(false)}>
                    <div className="fa fa-search"></div>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="close_btn" onClick={() => setSearchOpen(false)}>
          <i className="fal fa-times"></i>
        </div>
      </div>

      {/* Logo Area */}
      <div className="theme-1 white_bg">
        <div className="logo_area">
          <div className="container">
            <div className="row" style={{ alignItems: "center" }}>
              <div style={{ flex: "0 0 33.333%", maxWidth: "33.333%", padding: "0 15px" }}>
                <div className="logo">
                  <Link href="/">
                    <img alt="Newsprk" src="/images/newsprk_dark.svg" />
                  </Link>
                </div>
              </div>
              <div style={{ flex: "0 0 66.667%", maxWidth: "66.667%", padding: "0 15px" }}>
                <div className="banner1">
                  <a href="#" target="_blank">
                    <img alt="Newsprk ads" src="/images/04@2x-1.png" style={{ width: "100%" }} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="main-menu">
          <div className="main-nav">
            <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "stretch" }}>
              <nav style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
                {/* Mobile Toggle */}
                <button
                  className="navbar-toggler"
                  onClick={() => setMobileMenuOpen(true)}
                  style={{ display: "none" }}
                  aria-label="Open menu"
                >
                  <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                    <rect width="22" height="2" fill="white"/>
                    <rect y="7" width="22" height="2" fill="white"/>
                    <rect y="14" width="22" height="2" fill="white"/>
                  </svg>
                </button>

                <ul className="navbar-nav">
                  {menuItems.map((item, idx) => (
                    <li key={idx} className={item.hasDropdown ? "dropdown-parent" : ""}>
                      <a href={item.href}>
                        {item.label}
                        {item.hasDropdown && <span style={{ marginLeft: "4px", fontSize: "10px" }}>&#9662;</span>}
                      </a>
                      {item.hasDropdown && (
                        <ul className="dropdown-menu">
                          {item.label === "Home" && (
                            <>
                              <li><Link href="/">Home 1</Link></li>
                              <li><a href="#">Home 2</a></li>
                              <li><a href="#">Home 3</a></li>
                              <li><a href="#">Home 4 Dark</a></li>
                              <li><a href="#">Home 5</a></li>
                            </>
                          )}
                          {item.label === "Categores" && (
                            <>
                              <li><a href="#">Business</a></li>
                              <li><a href="#">Finance</a></li>
                              <li><a href="#">Entertainment</a></li>
                              <li><a href="#">Sports</a></li>
                              <li><a href="#">Travel</a></li>
                            </>
                          )}
                          {item.label === "Posts" && (
                            <>
                              <li><a href="#">Post 1</a></li>
                              <li><a href="#">Post 2</a></li>
                              <li><a href="#">Post 3</a></li>
                            </>
                          )}
                          {item.label === "Pages" && (
                            <>
                              <li><a href="#">Author</a></li>
                              <li><a href="#">Shop</a></li>
                              <li><a href="#">Archive</a></li>
                              <li><a href="#">404</a></li>
                            </>
                          )}
                        </ul>
                      )}
                    </li>
                  ))}
                  <li style={{ marginLeft: "auto" }}>
                    <a className="qs-menu--cart-contents" href="#" title="viewing cart">
                      <i className="fas fa-shopping-cart"></i> <span className="qs-wc-cart-count">0 items</span>
                    </a>
                  </li>
                </ul>
              </nav>

              <div className="menu_right">
                <div className="users_area">
                  <ul className="inline">
                    <li className="search_btn">
                      <i className="far fa-search" onClick={() => setSearchOpen(true)}></i>
                    </li>
                    <li>
                      <a href="#"><i className="fal fa-user-circle"></i></a>
                    </li>
                  </ul>
                </div>
                <div className="temp">
                  <div className="temp_icon">
                    <img alt="Weather icon" src="/images/icons/temp.png" />
                  </div>
                  <h3 className="temp_count">19.58</h3>
                  <div className="weather-area">London</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)} />

      {/* Offcanvas Mobile Menu */}
      <div className={`offcanvas__mobile__menu__main__wrapper ${mobileMenuOpen ? "active" : ""}`}>
        <a href="#" className="offcanvas__menu__close__trigger" onClick={() => setMobileMenuOpen(false)}>
          <img alt="close" src="/images/icons/cross.svg" />
        </a>
        <div className="offcanvas__menu__wrapper">
          <div className="offcanvas__menu__inner__content">
            <nav className="offcanvas__navigation">
              <ul>
                {menuItems.map((item, idx) => (
                  <li key={idx}>
                    <a href={item.href}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="offcanvas__mobile__menu__about">
              <div className="logo">
                <Link className="logo" href="/">
                  <img alt="Newsprk" src="/images/newsprk_dark.svg" />
                </Link>
              </div>
              <p>Do am he horrible distance marriage so throughout. Afraid assure square so happenmr an before. His many same been well can high that.</p>
              <div className="contact-info">
                <div className="single_contact">
                  <a href="#"> <i className="fas fa-phone-volume"></i> On Your Mobile</a>
                </div>
                <div className="single_contact">
                  <a href="#"> <i className="fas fa-microphone"></i> On Smart Speakers</a>
                </div>
                <div className="single_contact">
                  <a href="#"> <i className="fas fa-envelope"></i> Contact Newsprk</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
