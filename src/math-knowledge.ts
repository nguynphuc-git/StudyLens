/** Recognize only real, single-variable polynomial equations of degree <= 2.
 * Unsupported notation falls back to AI; this is not a general equation solver. */
type Poly = [number, number, number];
export function polynomialEquation(statement: string): { degree: 1 | 2; variable: string } | undefined {
  try {
    let text = statement.replace(/\\text\{[^{}]*\}/g, '').replace(/\\(?:left|right|,|;|!|quad|qquad)/g, '')
      .replace(/\\(?:cdot|times)/g, '*').replace(/\$|\s/g, '').replace(/²/g, '^2');
    if (/\\(?:frac\{d\}|int|sum|lim|sqrt|sin|cos|tan|log|ln)/.test(text)) return;
    text = text.replace(/^(?:solve(?:for)?|find)(?:[a-z]:)?/i, '').replace(/(?:solve(?:for)?[a-z]|find[a-z])$/i, '');
    for (let i = 0; i < 8 && /\\frac/.test(text); i++) text = text.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))');
    text = text.replace(/\{/g, '(').replace(/\}/g, ')');
    if (text.split('=').length !== 2 || /[^0-9a-z.+*/^()=\-]/i.test(text)) return;
    const letters = [...new Set(text.match(/[a-z]/gi))]; if (letters.length !== 1) return;
    const variable = letters[0];
    function parse(side: string): Poly {
      const tokens = side.match(/(?:\d+(?:\.\d*)?|\.\d+)|[a-z]|[+*/^()\-]/gi) ?? [];
      if (tokens.join('') !== side || tokens.length > 300) throw Error('Unsupported');
      let at = 0;
      const add = (a: Poly, b: Poly, sign = 1): Poly => [a[0] + sign*b[0], a[1] + sign*b[1], a[2] + sign*b[2]];
      const multiply = (a: Poly, b: Poly): Poly => {
        const terms = [0,0,0,0,0];
        for (let i=0;i<3;i++) for (let j=0;j<3;j++) terms[i+j] += a[i]*b[j];
        if (terms.slice(3).some(n => n !== 0)) throw Error('Degree');
        return terms.slice(0,3) as Poly;
      };
      function atom(): Poly {
        const token = tokens[at++];
        if (token === '(') { const p = expression(); if (tokens[at++] !== ')') throw Error('Group'); return p; }
        if (token === variable) return [0,1,0];
        if (token && /^\d|^\.\d/.test(token)) return [Number(token),0,0];
        throw Error('Atom');
      }
      function power(): Poly {
        let p = atom();
        if (tokens[at] === '^') {
          at++; const e=atom(); if (e[1] || e[2] || ![0,1,2].includes(e[0])) throw Error('Power');
          p = e[0] === 0 ? [1,0,0] : e[0] === 1 ? p : multiply(p,p);
        }
        return p;
      }
      function unary(): Poly {
        if (tokens[at] === '+') { at++; return unary(); }
        if (tokens[at] === '-') { at++; return unary().map(n => -n) as Poly; }
        return power();
      }
      function term(): Poly {
        let p=unary();
        while (at<tokens.length && tokens[at] !== ')' && !['+','-'].includes(tokens[at])) {
          if (tokens[at] === '/') { at++; const d=unary(); if (!d[0] || d[1] || d[2]) throw Error('Denominator'); p=p.map(n=>n/d[0]) as Poly; }
          else { if (tokens[at] === '*') at++; p=multiply(p,unary()); }
        }
        return p;
      }
      function expression(): Poly {
        let p=term();
        while (tokens[at] === '+' || tokens[at] === '-') { const sign=tokens[at++] === '+' ? 1 : -1; p=add(p,term(),sign); }
        return p;
      }
      const p=expression(); if (at !== tokens.length || !p.every(Number.isFinite)) throw Error('Remainder'); return p;
    }
    const [left,right]=text.split('=').map(parse);
    const coefficients=left.map((n,i)=>n-right[i]);
    if (coefficients.some(n => n !== 0 && Math.abs(n) <= 1e-10)) return;
    if (Math.abs(coefficients[2])>1e-10) return {degree:2,variable};
    if (Math.abs(coefficients[1])>1e-10) return {degree:1,variable};
  } catch { /* Deliberately decline uncertain classification. */ }
}
export function formulaReference(statement: string): string | undefined {
  const equation=polynomialEquation(statement); if (!equation) return;
  const x=equation.variable;
  if (equation.degree === 2) return String.raw`- **Standard form:** rearrange to $a${x}^2+b${x}+c=0$, where $a\ne0$.
- **Quadratic formula:** $${x}=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$. The discriminant is $\Delta=b^2-4ac$.
- **Real roots:** $\Delta>0$ gives two, $\Delta=0$ one repeated root, and $\Delta<0$ no real roots. Complex roots are possible over $\mathbb C$.`;
  return String.raw`- **Linear equation:** collect terms into $a${x}+b=0$, with $a\ne0$.
- **Equality rule:** apply the same operation to both sides to isolate $${x}$; the general relation is $${x}=-b/a$.`;
}

/** Short, conditional reference cues for AI, not a universal theorem selector. */
export function referenceContext(statement: string): string {
  const text=statement.toLowerCase();
  if (/derivative|differentiat|\\frac\{d\}/.test(text)) return String.raw`Reference: $(x^n)'=nx^{n-1}$. Chain rule: $(f(g(x)))'=f'(g(x))g'(x)$. Product rule: $(uv)'=u'v+uv'$. Select ONLY a rule required by this expression, not all rules.`;
  if (/integrat|antiderivative|\\int/.test(text)) return String.raw`Reference: $\int x^n\,dx=x^{n+1}/(n+1)+C$ for $n\ne-1$; $\int 1/x\,dx=\ln|x|+C$ for $x\ne0$. Definite integrals use $F(b)-F(a)$. Select only relevant rules; do not evaluate this problem.`;
  if (/logarithm|\\log|\\ln/.test(text)) return String.raw`For real logarithms: $\log_a(x)=y\iff a^y=x$, with $a>0,a\ne1,x>0$. Product rule: $\log_a(xy)=\log_a x+\log_a y$ when $x,y>0$. Select only relevant facts.`;
  if (/right.?angled|pythagor/.test(text)) return String.raw`Pythagoras: $a^2+b^2=c^2$ ONLY for a right triangle with hypotenuse $c$. Do not assume a right angle unless given.`;
  if (/probability|bayes|conditional probability/.test(text)) return String.raw`Conditional probability: $P(A\mid B)=P(A\cap B)/P(B)$ for $P(B)>0$. Bayes: $P(A\mid B)=P(B\mid A)P(A)/P(B)$. Do not assume independence unless given.`;
  if (/matrix|determinant|\\begin\{[pb]?matrix/.test(text)) return String.raw`An inverse exists only for a square matrix with nonzero determinant. For $A=\begin{pmatrix}a&b\\c&d\end{pmatrix}$, $\det A=ad-bc$. Use only a fact relevant to the operation requested.`;
  if (/arithmetic (sequence|progression)/.test(text)) return String.raw`Arithmetic sequence: $a_n=a_1+(n-1)d$; $S_n=n(a_1+a_n)/2$, with $n$ a positive integer. Define the common difference; do not evaluate.`;
  if (/geometric (sequence|progression)/.test(text)) return String.raw`Geometric sequence: $a_n=a_1r^{n-1}$; finite sum $S_n=a_1(1-r^n)/(1-r)$ for $r\ne1$. For $r=1$, $S_n=na_1$.`;
  if (/trig|\\sin|\\cos|\\tan/.test(text)) return String.raw`Basic identity: $\sin^2\theta+\cos^2\theta=1$. $\tan\theta=\sin\theta/\cos\theta$ requires $\cos\theta\ne0$. Pick the relevant identity; do not dump a general list.`;
  return '';
}
