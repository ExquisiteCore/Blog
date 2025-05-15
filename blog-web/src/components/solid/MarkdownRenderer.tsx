import { createSignal, onMount } from "solid-js";

import "@/styles/markdown.scss";

export default function MarkdownRenderer(props: { content: string }) {
  const [html, setHtml] = createSignal("");

  onMount(async () => {
    const wasm = await import("../../../md-wasm/pkg");
    await wasm.default(); // 初始化 WASM
    const rendered = wasm.render_markdown(props.content);
    setHtml(rendered);
  });

  return (
    <div class="prose prose-indigo mx-auto p-4 bg-white rounded shadow-md">
      <div class="markdown-body" innerHTML={html()} />
    </div>
  );
}
