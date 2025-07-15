"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBookOpen,
  FaMagic,
  FaBars,
  FaTimes,
  FaBook,
  FaCarrot,
} from "react-icons/fa";
import { useState } from "react";

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-modern">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover-scale">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-teal-500">
              <FaBook className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text-brand">
              MonLivreDeRecettes
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`nav-link flex items-center space-x-2 transition-all duration-200 ${
                pathname === "/" ? "nav-link-active" : ""
              }`}
            >
              <FaMagic className="h-4 w-4" />
              <span>Générer</span>
            </Link>
            <Link
              href="/recipes"
              className={`nav-link flex items-center space-x-2 transition-all duration-200 ${
                pathname === "/recipes" ? "nav-link-active" : ""
              }`}
            >
              <FaBookOpen className="h-4 w-4" />
              <span>Mes Recettes</span>
            </Link>
            <Link
              href="/ingredients"
              className={`nav-link flex items-center space-x-2 transition-all duration-200 ${
                pathname === "/ingredients" ? "nav-link-active" : ""
              }`}
            >
              <FaCarrot className="h-4 w-4" />
              <span>Ingrédients</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="btn-ghost p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <FaTimes className="h-5 w-5" />
              ) : (
                <FaBars className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
            <div className="py-4 space-y-2">
              <Link
                href="/"
                className={`block px-4 py-2 rounded-lg transition-all duration-200 ${
                  pathname === "/"
                    ? "nav-link-active bg-slate-100"
                    : "nav-link hover:bg-slate-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <FaMagic className="h-4 w-4" />
                  <span>Générer</span>
                </div>
              </Link>
              <Link
                href="/recipes"
                className={`block px-4 py-2 rounded-lg transition-all duration-200 ${
                  pathname === "/recipes"
                    ? "nav-link-active bg-slate-100"
                    : "nav-link hover:bg-slate-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <FaBookOpen className="h-4 w-4" />
                  <span>Mes Recettes</span>
                </div>
              </Link>
              <Link
                href="/ingredients"
                className={`block px-4 py-2 rounded-lg transition-all duration-200 ${
                  pathname === "/ingredients"
                    ? "nav-link-active bg-slate-100"
                    : "nav-link hover:bg-slate-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <FaCarrot className="h-4 w-4" />
                  <span>Ingrédients</span>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
