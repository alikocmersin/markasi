"use client";

import { useEffect, useState } from "react";

type MarqueeBarProps = {
  initialText?: string;
  initialEnabled?: string;
  initialBg?: string;
  initialColor?: string;
};

export function MarqueeBar({
  initialText = "Markasi Otomotiv — Orijinal ve eşdeğer yedek parçalar, anlık stok ve tedarikçi fiyatları ile hizmetinizde. Kampanyalar için bizi takip edin!",
  initialEnabled = "1",
  initialBg = "#f36b2b",
  initialColor = "#ffffff",
}: MarqueeBarProps) {
  const [text, setText] = useState(initialText);
  const [enabled, setEnabled] = useState(initialEnabled !== "0" && initialEnabled !== "false");
  const [bg, setBg] = useState(initialBg);
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    // 1. Check local storage fallback immediately
    try {
      const stored = localStorage.getItem("markasi_site_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.marquee_text) setText(parsed.marquee_text);
        if (parsed.marquee_enabled !== undefined) {
          setEnabled(parsed.marquee_enabled !== "0" && parsed.marquee_enabled !== "false");
        }
        if (parsed.marquee_bg) setBg(parsed.marquee_bg);
        if (parsed.marquee_color) setColor(parsed.marquee_color);
      }
    } catch {}

    // 2. Fetch fresh dynamic settings from server (bypassing any browser/edge cache)
    fetch(`/api/admin/cms?_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.settings) return;
        const s = data.settings;
        if (s.marquee_text !== undefined) setText(s.marquee_text);
        if (s.marquee_enabled !== undefined) {
          setEnabled(s.marquee_enabled !== "0" && s.marquee_enabled !== "false");
        }
        if (s.marquee_bg) setBg(s.marquee_bg);
        if (s.marquee_color) setColor(s.marquee_color);
      })
      .catch(() => {});
  }, []);

  if (!enabled || !text) return null;

  return (
    <div
      style={{ backgroundColor: bg || "#f36b2b", color: color || "#ffffff" }}
      className="overflow-hidden text-xs font-bold py-1 transition-colors select-none"
    >
      <div className="animate-marquee">{text}</div>
    </div>
  );
}

