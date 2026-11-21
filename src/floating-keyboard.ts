export interface Point { x:number; y:number }
/** Leave the complete panel (especially its close handle) reachable after drag/resize. */
export function keyboardPosition(point:Point, size:{width:number;height:number}, viewport:{width:number;height:number}):Point {
  const margin=8;
  return {x:Math.max(margin,Math.min(point.x,Math.max(margin,viewport.width-size.width-margin))),y:Math.max(margin,Math.min(point.y,Math.max(margin,viewport.height-size.height-margin)))};
}
