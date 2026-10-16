"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/format";
import styles from "./AudioPlayer.module.css";

/**
 * Accessible audio player.
 * - Native <audio> element for reliable streaming and byte-range support.
 * - Custom controls: play/pause, seek, elapsed/total duration, progress.
 * - Keyboard accessible; ARIA labels in Persian.
 */
export function AudioPlayer({
  src,
  title,
  durationSeconds,
}: {
  src: string;
  title: string;
  durationSeconds?: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrent(audio.currentTime);
    const onLoaded = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onEnd = () => setPlaying(false);
    const onErr = () =>
      setError("پخش فایل صوتی ممکن نشد. لطفاً دوباره تلاش کنید.");

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().then(() => setPlaying(true)).catch(() => {
        setError("پخش فایل صوتی ممکن نشد.");
      });
    }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(e.target.value);
    audio.currentTime = value;
    setCurrent(value);
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className={styles.player}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        className={styles.playButton}
        onClick={toggle}
        aria-label={playing ? `توقف ${title}` : `پخش ${title}`}
      >
        {playing ? (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className={styles.track}>
        <label htmlFor={`seek-${title}`} className="visually-hidden">
          جای‌نمای پخش
        </label>
        <input
          id={`seek-${title}`}
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={seek}
          className={styles.range}
          style={{ ["--progress" as string]: `${progress}%` }}
          aria-valuetext={`${formatDuration(current)} از ${formatDuration(duration)}`}
        />
        <div className={styles.times}>
          <span>{formatDuration(current)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
