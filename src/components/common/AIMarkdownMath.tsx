import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AIMarkdownMathProps {
  content: string;
  className?: string;
}

/**
 * Normalizes LaTeX delimiters from LLM responses (`\[...\]` and `\(...\)`)
 * into `$$...$$` and `$...$` expected by remark-math while preserving fenced code blocks.
 */
function normalizeLatexDelimiters(raw: string): string {
  if (!raw) return '';

  // Split by fenced code blocks so code examples aren't altered
  const segments = raw.split(/(```[\s\S]*?```)/g);
  return segments
    .map((seg, idx) => {
      if (idx % 2 === 1) return seg;

      // Convert display math \[ ... \] -> \n$$\n ... \n$$\n
      let out = seg.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => {
        return `\n$$\n${inner.trim()}\n$$\n`;
      });

      // Convert inline math \( ... \) -> $ ... $
      out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => {
        return `$${inner.trim()}$`;
      });

      // Clean leading Unicode open/filled bullet characters (`• ` or `◦ `) inside list lines
      // so Markdown parses them as native nested lists with clean circle bullets
      out = out.replace(/^([ \t]*)[•◦○]\s+/gm, '$1- ');

      return out;
    })
    .join('');
}

export const AIMarkdownMath: React.FC<AIMarkdownMathProps> = ({ content, className = '' }) => {
  const normalized = normalizeLatexDelimiters(content);

  return (
    <div className={`ai-math-prose text-[13px] sm:text-sm leading-relaxed break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
          h1: ({ children }) => (
            <h1 className="font-serif text-base sm:text-lg font-bold mt-3 mb-1.5 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-serif text-sm sm:text-base font-bold mt-3 mb-1.5 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-serif text-sm font-bold mt-2.5 mb-1 first:mt-0">{children}</h3>
          ),
          ul: ({ children }) => <ul className="ai-math-ul my-2 space-y-1.5 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 space-y-1.5 pl-5 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 border-l-2 border-slate-400/50 pl-3 italic opacity-90">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <table className="w-full text-left text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-slate-200/70 dark:border-slate-700 px-3 py-2 font-bold bg-slate-100/60 dark:bg-slate-800/60">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-slate-200/40 dark:border-slate-800 px-3 py-2">{children}</td>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isBlock = Boolean(codeClassName);
            if (isBlock) {
              return (
                <pre className="my-2.5 overflow-x-auto rounded-xl bg-slate-950/90 p-3 text-xs font-mono text-slate-100">
                  <code className={codeClassName} {...props}>
                    {children}
                  </code>
                </pre>
              );
            }
            return (
              <code
                className="rounded px-1.5 py-0.5 text-[0.9em] font-mono bg-slate-500/15"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
};
