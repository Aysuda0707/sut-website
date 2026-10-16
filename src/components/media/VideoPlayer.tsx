"use client";

import { useRef, useState } from "react";
import styles from "./VideoPlayer.module.css";

/**
 * Accessible video player.
 * Uses the native <video> element, which supports byte-range requests and
 * streaming from object storage. Captions/transcript are provided separately.
 */
export function VideoPlayer({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={styles.wrapper}>
      <video
        ref={videoRef}
        className={styles.video}
        controls
        preload="metadata"
        poster={poster}
        onError={() =>
          setError("پخش ویدیو ممکن نشد. لطفاً دوباره تلاش کنید.")
        }
        aria-label={title}
      >
        <source src={src} />
        مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
      </video>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
