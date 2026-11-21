import { memo } from 'react';
import katex from 'katex';
import { latexMessageParts } from '../chat-format';
import 'katex/dist/katex.min.css';

/** Static conversation content avoids mounting an interactive editor for every message. */
export const LatexMessage = memo(function LatexMessage({ value, label }: { value: string; label?: string }) {
  return <div className="markdown latex-message" role={label ? 'group' : undefined} aria-label={label}>{latexMessageParts(value).map((part, index) => {
    if (part.kind === 'break') return <br key={index}/>;
    if (part.kind === 'text') return <span className="latex-message-text" key={index}>{part.value}</span>;
    const html = katex.renderToString(part.value, { trust: false, strict: 'ignore', throwOnError: false, output: 'htmlAndMathml', maxExpand: 1000 });
    return <span className="latex-message-math" key={index} dangerouslySetInnerHTML={{ __html: html }}/>;
  })}</div>;
});
