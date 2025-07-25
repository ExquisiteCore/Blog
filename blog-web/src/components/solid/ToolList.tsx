import { createSignal, onMount } from 'solid-js';

const tools = [
  {
    id: 'markdownrender',
    name: 'md编辑器',
    description:
      '一款基于Rust编写Wasm的Markdown编辑器，支持实时预览、导出、导入、复制、粘贴、撤销、重做、全屏、快捷键等功能。',
    category: ['text', 'markdown'],
    image: '/markdown-svgrepo-com.svg',
    type: 'editor',
  },
];

export default function ToolList() {
  const [filteredTools, setFilteredTools] = createSignal(tools);

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedCategory = params.get('category') || 'all';

    const result =
      selectedCategory === 'all'
        ? tools
        : tools.filter((tool) => tool.type === selectedCategory);

    setFilteredTools(result);
  });

  return (
    <>
      {filteredTools().length > 0 ? (
        filteredTools().map((tool) => (
          <a
            href={`/tools/${tool.id}`}
            class="dark:border-base-700 dark:bg-base-800 card h-full cursor-pointer overflow-hidden border border-base-200 bg-base-100 transition-all hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg"
          >
            <figure class="aspect-video w-full overflow-hidden">
              <img
                src={tool.image}
                alt={tool.name}
                class="h-full w-full object-cover transition-transform hover:scale-105"
                loading="lazy"
              />
            </figure>
            <div class="card-body p-5">
              <div class="mb-2 flex items-center gap-2">
                <div class="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-content">
                  EC
                </div>
                <div class="flex flex-wrap gap-1">
                  {Array.isArray(tool.category) ? (
                    tool.category.map((cat) => (
                      <span class="badge-outline badge rounded-full badge-sm px-2 py-1 text-xs badge-primary">
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span class="badge-outline badge rounded-full badge-sm px-2 py-1 text-xs badge-primary">
                      {tool.category}
                    </span>
                  )}
                </div>
              </div>
              <h2 class="mt-1 mb-2 card-title text-xl">{tool.name}</h2>
              <p class="text-base-content/80">{tool.description}</p>
            </div>
          </a>
        ))
      ) : (
        <div class="col-span-1 py-16 text-center md:col-span-2 lg:col-span-3">
          <div class="flex flex-col items-center justify-center gap-4">
            <div class="text-5xl">🔍</div>
            <h3 class="text-2xl font-bold">没有找到相关工具</h3>
            <p class="text-base-content/70">
              请尝试选择其他分类或返回查看全部工具
            </p>
            <a href="/tools" class="btn mt-4 btn-primary">
              查看全部工具
            </a>
          </div>
        </div>
      )}
    </>
  );
}
