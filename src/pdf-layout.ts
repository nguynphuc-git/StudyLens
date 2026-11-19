export interface PdfTextFragment { str: string; transform: number[]; width?: number; height?: number; hasEOL?: boolean }
interface Fragment { text: string; x: number; y: number; size: number; width: number; script?: boolean; superscript?:string; subscript?:string }
interface Row { y: number; size: number; items: Fragment[] }

/** PDF reading order comes from geometry, not every glyph's baseline or hasEOL flag. */
export function reconstructPdfText(fragments: PdfTextFragment[]): string {
  const items: Fragment[] = fragments.filter(item => item.str.trim()).map(item => {
    const size = Math.abs(item.height || Math.hypot(item.transform[0], item.transform[1])) || 10;
    return { text:item.str.normalize('NFC'), x:item.transform[4], y:item.transform[5], size, width:item.width ?? item.str.length * size * .5 };
  }).sort((a,b) => b.y - a.y || a.x - b.x);
  const rows: Row[] = [];
  for (const item of items) {
    const last = rows.at(-1);
    if (last && Math.abs(last.y - item.y) <= Math.min(last.size, item.size) * .28) { last.items.push(item); last.size = Math.max(last.size,item.size); }
    else rows.push({y:item.y,size:item.size,items:[item]});
  }
  // Raised/lowered small glyphs belong to a nearby math base, not a separate paragraph.
  for (const row of rows) {
    for (const item of [...row.items]) {
      if (item.script || !/^[\dA-Za-zα-ω+−-]{1,8}$/.test(item.text)) continue;
      const candidates = rows.filter(target => target !== row && target.size >= item.size * 1.2 && Math.abs(target.y - item.y) <= target.size * .85);
      const match = candidates.flatMap(target => target.items.filter(base => !base.script && /(?:[\dA-Za-zα-ω)\]}])$/.test(base.text.trim())
        && !/\p{L}{2,}/u.test(base.text.trim()) && item.x >= base.x + base.width - target.size * .3 && item.x <= base.x + base.width + target.size * .6)
        .map(base => ({target,base,distance:Math.abs(item.x - base.x - base.width) + Math.abs(item.y-target.y)})))
        .sort((a,b) => a.distance-b.distance)[0];
      if (match) {
        const kind = item.y > match.target.y ? 'superscript' : 'subscript';
        match.base[kind] = (match.base[kind] ?? '') + item.text;
        match.base.width = Math.max(match.base.width,item.x + item.width - match.base.x);
        item.script = true;
      }
    }
  }
  const lines: string[] = [];
  for (const row of rows) {
    const active = row.items.filter(item => !item.script).sort((a,b) => a.x-b.x);
    if (!active.length) continue;
    let line = ''; let previous: Fragment | undefined;
    for (const item of active) {
      const gap = previous ? item.x - previous.x - previous.width : 0;
      if (line && !/\s$/.test(line) && !/^\s/.test(item.text) && gap > row.size * .12) line += ' ';
      line += item.text + (item.subscript ? `_{${item.subscript}}` : '') + (item.superscript ? `^{${item.superscript}}` : ''); previous = item;
    }
    lines.push(line.trim());
  }
  return lines.join('\n');
}
