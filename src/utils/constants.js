export const GREEN = "#22C55E";
export const RED = "#EF4444";
export const YELLOW = "#EAB308";
export const BLUE = "#60A5FA";
export const PURPLE = "#A78BFA";

export const PAPER = "#0B0F19";
export const INK = "#E8F0EB";
export const INK_SOFT = "#94a3b8";
export const LINE = "#1e293b";
export const LINE_STRONG = "#334155";

export const SURFACE = "#1F2937";
export const SURFACE_SOFT = "#111827";

export const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');
`;

export const BACKUP_VERSION = 1;

export const DEFAULT_HIGHLIGHTED_FIELDS = [];
export const DEFAULT_HIGHLIGHT_COLOR = "#22C55E";

export const DEFAULT_COLOR_RULES = {
  avanco: {
    sim: "rgba(34, 197, 94, 0.22)",
    nao: "rgba(239, 68, 68, 0.20)"
  }
};

// Regras de cor por prefixo de código (ex.: CE3 = roxa, E3 = verde, I5+ = azul, GMB = vermelha)
// O usuário pode editar/adicionar essas regras em Configurar colunas.
export const DEFAULT_CODE_COLOR_RULES = [
  { id: "rule-ce3", prefix: "CE3", color: PURPLE, label: "Roxa" },
  { id: "rule-e3", prefix: "E3", color: GREEN, label: "Verde" },
  { id: "rule-i5", prefix: "I5+", color: BLUE, label: "Azul" },
  { id: "rule-gmb", prefix: "GMB", color: RED, label: "Vermelha" }
];
