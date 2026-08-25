import { useId } from "react";

export default function SeedLineLogo({ height = 56, theme = "dark" }) {
  const uid = useId();
  const id = `sl${uid.replace(/[^a-zA-Z0-9-]/g, "")}`;
  const width = Math.round((height / 72) * 330);
  const NEON = "#39FF6A";
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 330 72"
      fill="none"
      role="img"
      aria-label="SeedLine"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8AFFAB" />
          <stop offset="1" stopColor="#16C24E" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ícone circular: seta contínua + broto */}
      <g filter={`url(#${id}-glow)`}>
        <path
          d="M46.5 17.8 A21 21 0 1 0 55.7 43.2"
          stroke={NEON}
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <path d="M53.2 37.4 L61.8 41.4 L54.6 47.8 Z" fill={NEON} />
        <path
          d="M36 46 L36 32"
          stroke={NEON}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path d="M36 35 Q26.5 33 25 23.5 Q34.5 24.5 36 35 Z" fill={`url(#${id}-grad)`} />
        <path d="M36 31 Q45.5 29 47 19.5 Q37.5 20.5 36 31 Z" fill={`url(#${id}-grad)`} />
      </g>

      {/* Texto SeedLine */}
      <text
        x="74"
        y="47"
        fill={theme === "light" ? "#0B0F19" : "#FFFFFF"}
        fontSize="34"
        fontWeight="700"
        letterSpacing="0.5"
        textLength="150"
        lengthAdjust="spacingAndGlyphs"
        style={{
          fontFamily: "'Nunito', 'Segoe UI', 'IBM Plex Sans', -apple-system, sans-serif"
        }}
      >
        Seed<tspan>Line</tspan>
      </text>

      {/* Símbolo de fita de RNA ao longo da base do texto (azul neon) */}
      <g filter={`url(#${id}-glow)`} transform="translate(76 60)" stroke="#38BDF8">
        <path
          d="M0 0 Q6.5 -5 13 0 T26 0 T39 0 T52 0 T65 0 T78 0 T91 0 T104 0 T117 0 T130 0 T143 0"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {[8, 21, 34, 47, 60, 73, 86, 99, 112, 125, 138].map((x) => (
          <path key={x} d={`M${x} -4 L${x} 4`} strokeWidth="2" strokeLinecap="round" />
        ))}
      </g>

      {/* Ícone de planta à direita (duas folhas + haste, estilo milho jovem) */}
      <g filter={`url(#${id}-glow)`} transform="translate(292 12)">
        <path
          d="M8 44 L8 26"
          stroke={NEON}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path d="M8 38 Q-1.5 36 -3 26.5 Q6.5 27.5 8 38 Z" fill={`url(#${id}-grad)`} />
        <path d="M8 38 Q17.5 36 19 26.5 Q9.5 27.5 8 38 Z" fill={`url(#${id}-grad)`} />
        <path d="M8 30 Q8 20 8 15 Q10 21 8 30 Z" fill={NEON} />
      </g>
    </svg>
  );
}
