import { cn } from "@/lib/utils";
import React from "react";

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}) {
  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem]",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className
      )}
    >
      {/* The first animated track */}
      <div
        className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
          "animate-marquee flex-row": !vertical && !reverse,
          "animate-marquee-reverse flex-row": !vertical && reverse,
          "animate-marquee-vertical flex-col": vertical,
          "group-hover:[animation-play-state:paused]": pauseOnHover,
        })}
      >
        {Array(repeat)
          .fill(0)
          .map((_, i) => (
            <React.Fragment key={i}>{children}</React.Fragment>
          ))}
      </div>

      {/* The second animated track (for the seamless loop) */}
      <div
        className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
          "animate-marquee flex-row": !vertical && !reverse,
          "animate-marquee-reverse flex-row": !vertical && reverse,
          "animate-marquee-vertical flex-col": vertical,
          "group-hover:[animation-play-state:paused]": pauseOnHover,
        })}
        aria-hidden="true"
      >
        {Array(repeat)
          .fill(0)
          .map((_, i) => (
            <React.Fragment key={i}>{children}</React.Fragment>
          ))}
      </div>
    </div>
  );
}
