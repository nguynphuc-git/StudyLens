export type GeometryFigure = 'triangle' | 'quadrilateral' | 'rectangle' | 'trapezoid' | 'circle' | 'prism' | 'pyramid' | 'cylinder' | 'cone' | 'sphere';
export type DiagramTool = 'pen' | 'line' | 'label';

export interface DiagramStroke {
  id: string;
  tool: DiagramTool;
  color: string;
  points: { x: number; y: number }[];
  text?: string;
}

export interface GeometryDiagram {
  figure: GeometryFigure;
  vertices: string[];
  givens: string[];
  strokes: DiagramStroke[];
}

const figurePatterns: [GeometryFigure, RegExp][] = [
  ['prism', /\b(?:rectangular|triangular|square|right)?\s*prism\b|\b(?:cuboid|cube)\b|lăng trụ|hình hộp/i],
  ['pyramid', /\bpyramid\b|hình chóp/i],
  ['cylinder', /\bcylinder\b|hình trụ/i],
  ['cone', /\bcone\b|hình nón/i],
  ['sphere', /\b(?:sphere|hemisphere)\b|hình cầu/i],
  ['circle', /\b(?:circle|circular|circumcircle|incircle|tangent|chord)\b|đường tròn|hình tròn/i],
  ['trapezoid', /\b(?:trapezoid|trapezium)\b|hình thang/i],
  ['rectangle', /\b(?:rectangle|rectangular|square)\b|hình chữ nhật|hình vuông/i],
  ['quadrilateral', /\b(?:quadrilateral|parallelogram|rhombus|kite)\b|tứ giác|hình bình hành|hình thoi|hình diều/i],
  ['triangle', /\b(?:triangle|triangular|hypotenuse)\b|tam giác/i],
];

function cleanStatement(statement: string): string {
  return statement.replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '$1')
    .replace(/\\(?:left|right|quad|qquad)\b/g, ' ')
    .replace(/\\[()[\]]/g, ' ')
    .replace(/\s+/g, ' ');
}

function getVertices(statement: string, figure: GeometryFigure): string[] {
  const nouns: Record<GeometryFigure, string> = {
    triangle: '(?:triangle|tam\\s+giác)',
    quadrilateral: '(?:quadrilateral|tứ\\s+giác|parallelogram|rhombus|kite|hình\\s+bình\\s+hành|hình\\s+thoi|hình\\s+diều)',
    rectangle: '(?:rectangle|square|hình\\s+chữ\\s+nhật|hình\\s+vuông)',
    trapezoid: '(?:trapezoid|trapezium|hình\\s+thang)',
    circle: '(?:circle|đường\\s+tròn|hình\\s+tròn)',
    prism: '(?:prism|cuboid|cube|lăng\\s+trụ|hình\\s+hộp)',
    pyramid: '(?:pyramid|hình\\s+chóp)',
    cylinder: '(?:cylinder|hình\\s+trụ)',
    cone: '(?:cone|hình\\s+nón)',
    sphere: '(?:sphere|hemisphere|hình\\s+cầu)',
  };
  const noun = nouns[figure];
  const match = new RegExp(`\\b${noun}\\s+([A-Z]{3,8})\\b`, 'i').exec(statement);
  if (match) {
    if (figure === 'triangle') return [...match[1].slice(0, 3).toUpperCase()];
    if (['quadrilateral', 'rectangle', 'trapezoid'].includes(figure)) return [...match[1].slice(0, 4).toUpperCase()];
  }
  if (figure === 'triangle') return ['A', 'B', 'C'];
  if (['quadrilateral', 'rectangle', 'trapezoid'].includes(figure)) return ['A', 'B', 'C', 'D'];
  if (figure === 'prism') return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  if (figure === 'pyramid') return ['S', 'A', 'B', 'C', 'D'];
  return [];
}

function readGivens(statement: string): string[] {
  const values = new Set<string>();
  const number = '(\\d+(?:[.,]\\d+)?)\\s*(mm|cm|km|m|degrees?|°|độ)?';
  const displayUnit = (unit?: string) => !unit || /^(?:degrees?|°|độ)$/i.test(unit) ? '°' : unit;
  const side = new RegExp(`\\b([A-Z]{2})\\s*(?:=|is)\\s*${number}`, 'gi');
  for (const match of statement.matchAll(side)) values.add(`${match[1].toUpperCase()} = ${match[2]}${match[3] && !/^(?:degrees?|°|độ)$/i.test(match[3]) ? ` ${match[3]}` : ''}`);
  const angle = new RegExp(`(?:\\b(?:angle|góc)\\s+|∠\\s*)([A-Z]{3})\\s*(?:=|is|là)?\\s*${number}`, 'gi');
  for (const match of statement.matchAll(angle)) values.add(`∠${match[1].toUpperCase()} = ${match[2]}${displayUnit(match[3])}`);
  const dimension = new RegExp(`(?:\\b(radius|diameter|height|slant height|side|base)\\s+(?:is|of|=)?\\s*|\\b(bán kính|đường kính|chiều cao|đường sinh|cạnh|đáy)\\s*(?:là|=)?\\s*)${number}`, 'gi');
  for (const match of statement.matchAll(dimension)) values.add(`${match[1] ?? match[2]} = ${match[3]}${match[4] && !/^(?:degrees?|°|độ)$/i.test(match[4]) ? ` ${match[4]}` : ''}`);
  return [...values].slice(0, 10);
}

/** Builds only a schematic from an explicitly named geometry; it never infers scale or right angles. */
export function geometryDiagramFromStatement(statement: string): GeometryDiagram | undefined {
  const text = cleanStatement(statement);
  const match = figurePatterns.find(([, pattern]) => pattern.test(text));
  if (!match) return;
  return { figure: match[0], vertices: getVertices(text, match[0]), givens: readGivens(text), strokes: [] };
}
