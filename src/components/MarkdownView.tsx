import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { normalizeChatMath } from '../chat-format';
import 'katex/dist/katex.min.css';
export const MarkdownView = memo(function MarkdownView({ value }: { value: string }) {
  return <div className="markdown"><ReactMarkdown
    skipHtml
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[[rehypeKatex, { trust: false, strict: 'warn', throwOnError: false }]]}
    components={{
      img: () => null,
      table: ({ node: _node, ...props }) => <div className="markdown-table" role="region" aria-label="Response table" tabIndex={0}><table {...props}/></div>,
      a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer"/>,
    }}
  >{normalizeChatMath(value)}</ReactMarkdown></div>;
});
