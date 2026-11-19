import type { MathfieldElement } from 'mathlive';
type PowerTarget = Pick<MathfieldElement, 'mode' | 'selectionIsCollapsed' | 'insert' | 'executeCommand'>;
/** Native superscript navigation attaches to the whole fenced atom, including nested groups. */
export function insertPower(field: PowerTarget, exponent?: string) {
  insertScript(field,'^',exponent);
}
export function insertSubscript(field:PowerTarget){insertScript(field,'_');}
function insertScript(field:PowerTarget,kind:'^'|'_',exponent?:string){
  if (!field.selectionIsCollapsed) {
    field.insert(`{#0}${kind}{${exponent ?? '#?'}}`, { format:'latex', mode:'math', selectionMode: exponent ? 'after' : 'placeholder' });
    return;
  }
  field.mode = 'math';
  if (!field.executeCommand(kind==='^'?'moveToSuperscript':'moveToSubscript')) return;
  if (exponent) {
    field.insert(exponent, { format:'latex', mode:'math', selectionMode:'after' });
    field.executeCommand('moveAfterParent');
  }
}
