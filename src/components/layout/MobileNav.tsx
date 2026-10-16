"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { primaryNav } from "@/lib/site";
import styles from "./MobileNav.module.css";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "بستن منو" : "باز کردن منو"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.bars} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label="منوی اصلی"
        >
          <nav>
            <ul className={styles.list}>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={styles.link}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
