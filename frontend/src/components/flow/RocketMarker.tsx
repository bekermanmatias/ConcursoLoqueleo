"use client";

import { useEffect, useState } from "react";

const ROCKET_FRAMES = [
  "/cohete/19 2.png",
  "/cohete/20 28.png",
  "/cohete/21 2.png",
].map((path) => encodeURI(path));

const FRAME_INTERVAL_MS = 500;

export default function RocketMarker() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    ROCKET_FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % ROCKET_FRAMES.length);
    }, FRAME_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <img
      key={frame}
      src={ROCKET_FRAMES[frame]}
      alt=""
      className="wizard-progress-rocket-img"
      width={96}
      height={96}
      decoding="async"
      draggable={false}
      aria-hidden="true"
    />
  );
}
