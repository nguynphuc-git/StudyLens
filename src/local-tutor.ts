export type ResponseStyle = 'auto' | 'brief' | 'explained';

/** Deliberately narrow exact solver. Never discard prose, conditions or diagrams. */
export function linearHelp(statement: string, purpose: string, question = '', style: ResponseStyle = 'auto'): string | undefined {
  const text = statement.trim().replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/^(?:solve(?:\s+for\s+[a-z])?\s*:?\s*)/i, '')
    .replace(/\\(?:cdot|times)/g, '*').replace(/[\s$]/g, '');
  if (text.length > 100 || text.split('=').length !== 2) return;
  const letters = [...new Set(text.match(/[a-z]/g))];
  if (letters.length !== 1) return;
  const variable = letters[0];
  function side(value: string): [number, number] | undefined {
    if (/^[+-]?\d+$/.test(value)) return [0, Number(value)];
    const match = /^([+-]?(?:\d+\*?)?)([a-z])([+-]\d+)?$/.exec(value);
    if (!match || match[2] !== variable) return;
    const coefficient = match[1].replace('*', '');
    return [coefficient === '' || coefficient === '+' ? 1 : coefficient === '-' ? -1 : Number(coefficient), Number(match[3] ?? 0)];
  }
  const [left, right] = text.split('=').map(side);
  if (!left || !right || [...left, ...right].some(n => !Number.isSafeInteger(n) || Math.abs(n) > 1_000_000)) return;
  if (purpose === 'chat' && !/^(?:please\s+)?(?:solve(?:\s+(?:it|this|the equation))?|show (?:the )?(?:solution|steps)|what is (?:the )?answer)[.!?]?$/i.test(question.replace(/\\text\{([^{}]*)\}/g, '$1').trim())) return;
  if (!['hint1', 'hint2', 'hint3', 'chat'].includes(purpose)) return;
  const a = left[0] - right[0], b = right[1] - left[1];
  if (purpose === 'hint1') return `Collect the $${variable}$ terms on one side and the constants on the other. Apply the same operation to both sides.`;
  if (purpose === 'hint2') return `Collecting terms gives $${a}${variable}=${b}$. ${a ? `Divide both sides by $${a}$.` : 'Check whether this equality can hold.'}`;
  if (!a) return b === 0 ? 'The equation reduces to $0=0$. Every real value satisfies it.' : `The equation reduces to $0=${b}$, a contradiction. There is no solution.`;
  const gcd = (x: number, y: number): number => y ? gcd(y, x % y) : x;
  const divisor = gcd(Math.abs(a), Math.abs(b));
  const numerator = b / divisor * Math.sign(a), denominator = Math.abs(a) / divisor;
  // Check the exact rational result against both original sides before returning it.
  if (left[0] * numerator + left[1] * denominator !== right[0] * numerator + right[1] * denominator) return;
  const value = denominator === 1 ? `${numerator}` : `${numerator < 0 ? '-' : ''}\\frac{${Math.abs(numerator)}}{${denominator}}`;
  const steps = `Collect terms: $${a}${variable}=${b}$.\n\nDivide by $${a}$: **$${variable}=${value}$**.`;
  return style === 'explained'
    ? `${steps}\n\nSubtract the variable terms and constants from both sides to preserve equality. Division by the nonzero coefficient isolates $${variable}$. Substitution confirms both sides are equal.`
    : steps;
}

export function localAnswerGuidance(style: ResponseStyle = 'auto'): string {
  const detail = style === 'brief'
    ? 'Be concise: equations and only essential explanations.'
    : style === 'explained'
      ? 'Explain why each necessary step works, without repeating the question.'
      : 'For routine problems use 2-4 short steps; for difficult problems include every necessary justification.';
  return `${detail} Choose one efficient valid method, not a list of alternatives. Check the result and domain. No greeting or repeated conclusion.`;
}
