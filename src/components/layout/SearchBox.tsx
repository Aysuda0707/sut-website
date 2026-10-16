"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./SearchBox.module.css";

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form className={styles.form} role="search" onSubmit={onSubmit}>
      <label htmlFor="site-search" className="visually-hidden">
        جست‌وجو در آرشیو
      </label>
      <input
        id="site-search"
        type="search"
        className={styles.input}
        placeholder="جست‌وجو…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" className={styles.button} aria-label="جست‌وجو">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </form>
  );
}
