"use client";

const RADIUS = 50;
const CIRCUMFERENCE = Math.PI * RADIUS;

export function ScoreGauge({ score }: { score: number }) {
  const offset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <svg viewBox="0 0 120 70" className="h-28 w-40">
      {/* background arc */}
      <path
        d="M 10 60 A 50 50 0 0 1 110 60"
        fill="none"
        stroke="var(--secondary)"
        strokeWidth="8"
      />
      {/* foreground arc */}
      <path
        d="M 10 60 A 50 50 0 0 1 110 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        className={score >= 50 ? "text-green-600" : "text-red-600"}
      />
      {/* score text */}
      <text
        x="60"
        y="55"
        textAnchor="middle"
        className="fill-foreground text-3xl font-medium"
        style={{ fontFamily: "inherit" }}
      >
        {score}
      </text>
    </svg>
  );
}
