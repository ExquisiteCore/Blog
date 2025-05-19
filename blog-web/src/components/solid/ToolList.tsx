import { createSignal, onMount } from "solid-js";

const tools = [
  {
    id: "markdownrender",
    name: "md编辑器",
    description:
      "一款基于Rust编写Wasm的Markdown编辑器，支持实时预览、导出、导入、复制、粘贴、撤销、重做、全屏、快捷键等功能。",
    category: ["text", "markdown"],
    image: "/markdown-svgrepo-com.svg",
    type: "editor",
  },
];

export default function ToolList() {
  const [filteredTools, setFilteredTools] = createSignal(tools);

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedCategory = params.get("category") || "all";

    const result =
      selectedCategory === "all"
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
            class="card h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] overflow-hidden border border-base-200 dark:border-base-700 bg-base-100 dark:bg-base-800"
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
              <div class="flex items-center gap-2 mb-2">
                <div class="flex items-center justify-center w-6 h-6 bg-primary text-primary-content rounded-md font-bold text-xs">
                  EC
                </div>
                <div class="flex flex-wrap gap-1">
                  {Array.isArray(tool.category) ? (
                    tool.category.map((cat) => (
                      <span class="badge badge-sm badge-primary badge-outline text-xs px-2 py-1 rounded-full">
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span class="badge badge-sm badge-primary badge-outline text-xs px-2 py-1 rounded-full">
                      {tool.category}
                    </span>
                  )}
                </div>
              </div>
              <h2 class="card-title text-xl mb-2 mt-1">{tool.name}</h2>
              <p class="text-base-content/80">{tool.description}</p>
            </div>
          </a>
        ))
      ) : (
        <div class="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center">
          <div class="flex flex-col items-center justify-center gap-4">
            <div class="text-5xl">🔍</div>
            <h3 class="text-2xl font-bold">没有找到相关工具</h3>
            <p class="text-base-content/70">
              请尝试选择其他分类或返回查看全部工具
            </p>
            <a href="/tools" class="btn btn-primary mt-4">
              查看全部工具
            </a>
          </div>
        </div>
      )}
    </>
  );
}
