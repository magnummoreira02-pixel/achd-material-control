const paths = {
  box: "M21 8l-9-5-9 5v8l9 5 9-5V8zm-9-2.7L18.6 8 12 11.7 5.4 8 12 5.3zM4.5 9.6L11 13.3v5.1l-6.5-3.6V9.6zm13 5.2L11 18.4v-5.1l6.5-3.7v5.2z",
  search: "M10 2a8 8 0 105.3 14l5 5 1.4-1.4-5-5A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z",
  qr: "M3 3h8v8H3V3zm2 2v4h4V5H5zM13 3h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zm0 2a7 7 0 100-14 7 7 0 000 14zm-1-19h2v3h-2V0zm0 21h2v3h-2v-3zM0 11h3v2H0v-2zm21 0h3v2h-3v-2zM3.4 4.9l1.5-1.5 2.1 2.1-1.4 1.5-2.2-2.1zm13.6 13.6l1.5-1.5 2.1 2.1-1.5 1.5-2.1-2.1zM20.6 4.9l-2.1 2.1 1.4 1.5 2.2-2.1-1.5-1.5zM6.9 18.6l-1.4-1.5-2.1 2.1 1.5 1.5 2-2.1z",
  moon: "M12.3 2a9.9 9.9 0 00-2 .2 10 10 0 118.5 8.5A10 10 0 0112.3 22a10 10 0 002-19.9 10 10 0 00-2-.1z",
  check: "M9 16.2l-3.5-3.5-1.4 1.4L9 19 20 8l-1.4-1.4L9 16.2z",
  x: "M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4z",
  camera: "M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4zM9 3L7.2 5H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.2L15 3H9z",
  upload: "M12 3l5.7 5.7-1.4 1.4L13 6.8V16h-2V6.8L7.7 10.1 6.3 8.7 12 3zM5 18h14v2H5v-2z",
  download: "M12 16l-5.7-5.7 1.4-1.4L11 12.2V3h2v9.2l3.3-3.3 1.4 1.4L12 16zm-7 2h14v2H5v-2z",
  trash: "M6 7h12l-1 14H7L6 7zm3-4h6l1 2h4v2H4V5h4l1-2z",
  print: "M6 3h12v4H6V3zm-2 6h16a2 2 0 012 2v6h-4v4H6v-4H2v-6a2 2 0 012-2zm4 8h8v4H8v-4z",
  alert: "M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-7h-2v5h2V9z",
  history: "M13 3a9 9 0 00-9 9H1l4 4 4-4H6a7 7 0 117 7 6.9 6.9 0 01-4.9-2l-1.4 1.4A9 9 0 1013 3zm-1 5v5l4.3 2.5.7-1.2-3.5-2.1V8H12z",
  columns: "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z",
  inventory: "M12 3l10 5-10 5L2 8l10-5zm0 2.3L6.9 8 12 10.7 17.1 8 12 5.3zM2 12l10 5 10-5-2.1-1L12 15 4.1 11 2 12zm0 4l10 5 10-5-2.1-1L12 19l-7.9-4L2 16z",
  menu: "M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z",
  "arrow-clockwise": "M17.65 6.35A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.76-4.24L13 11h7V4l-2.35 2.35z",
  refresh: "M17.65 6.35A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.76-4.24L13 11h7V4l-2.35 2.35z"
};

export default function Icon({ name, size = 20, color = "currentColor", style }) {
  const path = paths[name] || paths.box;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
