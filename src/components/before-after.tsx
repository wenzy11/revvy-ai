"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  before: string;
  after: string;
  showWatermark?: boolean;
};

export function BeforeAfter({ before, after, showWatermark = false }: Props) {
  const [position, setPosition] = useState(50);

  return (
    <div className="space-y-3">
      <div className="relative h-72 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white md:h-96">
        <Image src={before} alt="orijinal" fill unoptimized className="object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          <div className="relative h-full w-full">
            <Image src={after} alt="duzenlenmis" fill unoptimized className="object-cover" />
          </div>
        </div>
        <div
          className="pointer-events-none absolute bottom-4 right-4 rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white shadow-sm shadow-blue-200"
          hidden={!showWatermark}
        >
          Revvy AI PREVIEW
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        className="w-full accent-blue-600"
      />
    </div>
  );
}
