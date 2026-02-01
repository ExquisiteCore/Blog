'use client';

import { useEffect, useState } from 'react';
import { marked } from 'marked';
import '@/styles/markdown.scss';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    // 配置 marked
    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    // 渲染 Markdown
    const rendered = marked(content);
    if (typeof rendered === 'string') {
      setHtml(rendered);
    } else {
      rendered.then(setHtml);
    }
  }, [content]);

  return (
    <div className="prose-indigo mx-auto prose rounded bg-white p-4 shadow-md">
      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
