export type NavDockTarget = "pantry" | "grocery";

export interface FlyChipInput {
  label: string;
  subtitle?: string;
  sourceRect?: DOMRect | null;
  sourceEl?: HTMLElement | null;
  tone?: "emerald" | "orange";
  emoji?: string;
  imageUrl?: string;
}

export interface LaunchToNavOptions {
  targetTab: NavDockTarget;
  items: FlyChipInput[];
  badgeText: string;
  badgeTone?: "emerald" | "orange";
  staggerMs?: number;
  durationMs?: number;
  onDockImpact?: () => void;
  onAllComplete?: () => void;
}

export interface NavDockEventDetail {
  targetTab: NavDockTarget;
  badgeText: string;
  tone: "emerald" | "orange";
}

function getShellBackground(): string {
  if (typeof document === "undefined") return "#ECEAE2";
  const shell = document.querySelector("[data-zw-theme]") as HTMLElement | null;
  if (shell) {
    const val = getComputedStyle(shell).getPropertyValue("--zw-bg").trim();
    if (val) return val;
  }
  return "#ECEAE2";
}

function buildFloatingElement(item: FlyChipInput): HTMLDivElement {
  const el = document.createElement("div");
  const isOrange = item.tone === "orange";
  const isCardStyle = Boolean(item.imageUrl || item.emoji || item.subtitle);

  el.style.position = "fixed";
  el.style.left = "0px";
  el.style.top = "0px";
  el.style.zIndex = "9999";
  el.style.pointerEvents = "none";
  el.style.display = "inline-flex";
  el.style.alignItems = "center";
  el.style.willChange = "transform, opacity";

  if (isCardStyle) {
    el.style.gap = "10px";
    el.style.borderRadius = "18px";
    el.style.padding = "9px 14px 9px 10px";
    el.style.background = getShellBackground();
    el.style.border = "2px solid #006948";
    el.style.color = "#003824";
    el.style.fontWeight = "800";
    el.style.fontSize = "12.5px";
    el.style.lineHeight = "1.15";
    el.style.whiteSpace = "nowrap";
    el.style.maxWidth = "230px";
    el.style.boxShadow =
      "0 18px 34px -6px rgba(0, 71, 48, 0.35), 0 0 0 3px rgba(255,255,255,0.9)";

    const badge = document.createElement("div");
    badge.style.width = item.imageUrl ? "38px" : "28px";
    badge.style.height = item.imageUrl ? "38px" : "28px";
    badge.style.borderRadius = item.imageUrl ? "11px" : "9999px";
    badge.style.background = "#006948";
    badge.style.color = "#FFFFFF";
    badge.style.display = "flex";
    badge.style.alignItems = "center";
    badge.style.justifyContent = "center";
    badge.style.overflow = "hidden";
    badge.style.fontSize = item.imageUrl ? "19px" : "14px";
    badge.style.fontWeight = "900";
    badge.style.flexShrink = "0";

    if (item.imageUrl) {
      const img = document.createElement("img");
      img.src = item.imageUrl;
      img.alt = "";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      badge.appendChild(img);
    } else if (item.emoji) {
      badge.textContent = item.emoji;
    } else {
      badge.textContent = "✓";
    }
    el.appendChild(badge);

    const textCol = document.createElement("div");
    textCol.style.display = "flex";
    textCol.style.flexDirection = "column";
    textCol.style.gap = "2px";
    textCol.style.overflow = "hidden";

    const title = document.createElement("span");
    title.textContent = item.label.replace(/^✓\s*/, "");
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    textCol.appendChild(title);

    const sub = document.createElement("span");
    sub.textContent = item.subtitle || "Collecting to Pantry...";
    sub.style.fontSize = "9.5px";
    sub.style.fontWeight = "700";
    sub.style.color = "#006948";
    sub.style.overflow = "hidden";
    sub.style.textOverflow = "ellipsis";
    textCol.appendChild(sub);

    el.appendChild(textCol);
    return el;
  }

  el.style.gap = "6px";
  el.style.borderRadius = "9999px";
  el.style.padding = "9px 15px";
  el.style.background = isOrange ? "#EA580C" : "#004730";
  el.style.color = "#FFFFFF";
  el.style.fontWeight = "800";
  el.style.fontSize = "12.5px";
  el.style.lineHeight = "1";
  el.style.whiteSpace = "nowrap";
  el.style.border = "2.5px solid rgba(255, 255, 255, 0.95)";
  el.style.boxShadow = isOrange
    ? "0 14px 28px -4px rgba(234, 88, 12, 0.55)"
    : "0 14px 28px -4px rgba(0, 71, 48, 0.55)";

  const label = document.createElement("span");
  label.textContent = item.label;
  el.appendChild(label);

  return el;
}

/**
 * Collects cards/chips from their real viewport positions and floats them slowly
 * along a visible curved trajectory directly into the target bottom nav tab,
 * emitting `zw-nav-dock` on impact.
 */
export function launchToNavTab({
  targetTab,
  items,
  badgeText,
  badgeTone = "emerald",
  staggerMs = 175,
  durationMs = 1350,
  onDockImpact,
  onAllComplete,
}: LaunchToNavOptions): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    onDockImpact?.();
    onAllComplete?.();
    return;
  }

  const targetEl = document.querySelector(`[data-nav-tab="${targetTab}"]`) as HTMLElement | null;
  const targetRect = targetEl?.getBoundingClientRect();

  const prefersReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  if (!targetRect || targetRect.width === 0 || items.length === 0 || prefersReduced) {
    window.dispatchEvent(
      new CustomEvent<NavDockEventDetail>("zw-nav-dock", {
        detail: { targetTab, badgeText, tone: badgeTone },
      })
    );
    onDockImpact?.();
    onAllComplete?.();
    return;
  }

  const cappedItems = items.slice(0, 4);
  if (items.length > 4) {
    const extra = items.length - 3;
    cappedItems[3] = {
      ...items[3],
      label: `+${extra} more`,
    };
  }

  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  const impactDelay = Math.round(durationMs * 0.88);
  window.setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent<NavDockEventDetail>("zw-nav-dock", {
        detail: { targetTab, badgeText, tone: badgeTone },
      })
    );
    onDockImpact?.();
  }, impactDelay);

  let completed = 0;
  const finishOne = (el: HTMLElement) => {
    el.remove();
    completed += 1;
    if (completed >= cappedItems.length) {
      onAllComplete?.();
    }
  };

  cappedItems.forEach((item, idx) => {
    const rect = item.sourceRect ?? item.sourceEl?.getBoundingClientRect();
    if (!rect || rect.width === 0) {
      completed += 1;
      if (completed >= cappedItems.length) onAllComplete?.();
      return;
    }

    const floater = buildFloatingElement(item);
    document.body.appendChild(floater);

    const fRect = floater.getBoundingClientRect();
    const halfW = fRect.width / 2;
    const halfH = fRect.height / 2;

    const rawCenterY = rect.top + rect.height / 2;
    const clampedCenterY = Math.max(105, Math.min(window.innerHeight - 135, rawCenterY));

    const startX = rect.left + rect.width / 2 - halfW;
    const startY = clampedCenterY - halfH;
    const destX = endX - halfW;
    const destY = endY - halfH;

    const collectX = startX + (destX - startX) * 0.14;
    const collectY = Math.min(startY, destY) - 30;

    const midFloatX = startX + (destX - startX) * 0.56;
    const midFloatY = startY + (destY - startY) * 0.45 - 12;

    const dockNearX = startX + (destX - startX) * 0.88;
    const dockNearY = startY + (destY - startY) * 0.88;

    const delay = idx * staggerMs;

    if (typeof floater.animate === "function") {
      const anim = floater.animate(
        [
          {
            transform: `translate3d(${startX}px, ${startY}px, 0) scale(0.95)`,
            opacity: 1,
          },
          {
            transform: `translate3d(${collectX}px, ${collectY}px, 0) scale(1.04)`,
            opacity: 1,
            offset: 0.2,
          },
          {
            transform: `translate3d(${midFloatX}px, ${midFloatY}px, 0) scale(0.78)`,
            opacity: 1,
            offset: 0.58,
          },
          {
            transform: `translate3d(${dockNearX}px, ${dockNearY}px, 0) scale(0.45)`,
            opacity: 0.96,
            offset: 0.84,
          },
          {
            transform: `translate3d(${destX}px, ${destY}px, 0) scale(0.16)`,
            opacity: 0,
          },
        ],
        {
          duration: durationMs,
          delay,
          easing: "cubic-bezier(0.32, 0.08, 0.24, 1)",
          fill: "forwards",
        }
      );
      anim.onfinish = () => finishOne(floater);
      anim.oncancel = () => finishOne(floater);
    } else {
      window.setTimeout(() => finishOne(floater), delay + durationMs);
    }
  });
}
