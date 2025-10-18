import { createSignal, For, Show } from 'solid-js';

// 定义数据类型
interface Novel {
  id: string;
  title: string;
  cover: string;
  summary: string;
  createdAt: string;
  characters: Character[];
  worldSettings: WorldSetting[];
  background: string;
  relationships: Relationship[];
  timeline: TimelineEvent[];
  outlines: OutlineItem[];
}

interface Character {
  id: string;
  name: string;
  avatar: string;
  age: string;
  gender: string;
  personality: string;
  background: string;
  description: string;
}

interface WorldSetting {
  id: string;
  category: string;
  title: string;
  description: string;
}

interface Relationship {
  id: string;
  from: string;
  to: string;
  relation: string;
  description: string;
}

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
}

interface OutlineItem {
  id: string;
  chapter: string;
  title: string;
  content: string;
}

type ViewMode = 'home' | 'detail';
type ModalType = 'background' | 'characters' | 'relationships' | 'worldview' | 'timeline' | 'outline' | null;

export default function NovelDesigner() {
  // ID 生成计数器,避免快速连续创建时产生重复 ID
  let idCounter = 0;
  const generateId = () => {
    const timestamp = Date.now();
    idCounter = (idCounter + 1) % 1000;
    return `${timestamp}-${idCounter}`;
  };

  // 小说列表
  const [novels, setNovels] = createSignal<Novel[]>([]);
  const [selectedNovel, setSelectedNovel] = createSignal<Novel | null>(null);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [viewMode, setViewMode] = createSignal<ViewMode>('home');
  const [activeModal, setActiveModal] = createSignal<ModalType>(null);

  // 编辑状态
  const [editingCharacter, setEditingCharacter] = createSignal<Character | null>(null);
  const [editingWorld, setEditingWorld] = createSignal<WorldSetting | null>(null);
  const [editingRelationship, setEditingRelationship] = createSignal<Relationship | null>(null);
  const [editingTimeline, setEditingTimeline] = createSignal<TimelineEvent | null>(null);
  const [editingOutline, setEditingOutline] = createSignal<OutlineItem | null>(null);
  const [editingNovel, setEditingNovel] = createSignal<Partial<Novel> | null>(null);

  // 从 localStorage 加载数据
  const loadFromStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('novel-designer-novels');
      if (stored) {
        const data = JSON.parse(stored);
        setNovels(data || []);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  // 保存到 localStorage
  const saveToStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('novel-designer-novels', JSON.stringify(novels()));
    } catch (e) {
      console.error('Failed to save data:', e);
      alert('保存失败,可能是存储空间不足');
    }
  };

  // 初始化时加载数据
  if (typeof window !== 'undefined') {
    setTimeout(loadFromStorage, 0);
  }

  // 筛选小说
  const filteredNovels = () => {
    const query = searchQuery().toLowerCase();
    if (!query) return novels();
    return novels().filter((novel) => novel.title.toLowerCase().includes(query));
  };

  // 创建新小说
  const createNovel = () => {
    const newNovel: Novel = {
      id: generateId(),
      title: '未命名小说',
      cover: '',
      summary: '',
      createdAt: new Date().toLocaleString('zh-CN'),
      characters: [],
      worldSettings: [],
      background: '',
      relationships: [],
      timeline: [],
      outlines: [],
    };
    setEditingNovel(newNovel);
  };

  // 保存小说基本信息
  const saveNovelInfo = () => {
    const novel = editingNovel();
    if (!novel) return;

    const existing = novels().find((n) => n.id === novel.id);
    if (existing) {
      setNovels(novels().map((n) => (n.id === novel.id ? { ...existing, ...novel } : n)));
      setSelectedNovel({ ...existing, ...novel } as Novel);
    } else {
      const newNovel = novel as Novel;
      setNovels([...novels(), newNovel]);
      setSelectedNovel(newNovel);
    }
    setEditingNovel(null);
    setViewMode('detail');
    saveToStorage();
  };

  // 删除小说
  const deleteNovel = (id: string) => {
    if (confirm('确定要删除这部小说吗？所有相关数据都将被删除。')) {
      setNovels(novels().filter((n) => n.id !== id));
      if (selectedNovel()?.id === id) {
        setSelectedNovel(null);
        setViewMode('home');
      }
      saveToStorage();
    }
  };

  // 更新选中的小说
  const updateSelectedNovel = (updater: (novel: Novel) => Novel) => {
    const current = selectedNovel();
    if (!current) return;
    const updated = updater(current);
    setSelectedNovel(updated);
    setNovels(novels().map((n) => (n.id === updated.id ? updated : n)));
    saveToStorage();
  };

  // ===== 角色管理 =====
  const addCharacter = () => {
    setEditingCharacter({
      id: generateId(),
      name: '',
      avatar: '',
      age: '',
      gender: '',
      personality: '',
      background: '',
      description: '',
    });
  };

  const saveCharacter = () => {
    const char = editingCharacter();
    if (!char) return;

    // 验证必填字段
    if (!char.name.trim()) {
      alert('请输入角色姓名');
      return;
    }

    updateSelectedNovel((novel) => {
      const exists = novel.characters.find((c) => c.id === char.id);
      return {
        ...novel,
        characters: exists
          ? novel.characters.map((c) => (c.id === char.id ? char : c))
          : [...novel.characters, char],
      };
    });
    setEditingCharacter(null);
  };

  const deleteCharacter = (id: string) => {
    const novel = selectedNovel();
    if (!novel) return;

    const charToDelete = novel.characters.find((c) => c.id === id);
    if (!charToDelete) return;

    if (confirm('确定要删除这个角色吗？相关的人物关系也将被删除。')) {
      updateSelectedNovel((novel) => ({
        ...novel,
        characters: novel.characters.filter((c) => c.id !== id),
        // 同时删除与该角色相关的所有关系
        relationships: novel.relationships.filter(
          (r) => r.from !== charToDelete.name && r.to !== charToDelete.name
        ),
      }));
    }
  };

  // ===== 世界观设定 =====
  const addWorldSetting = () => {
    setEditingWorld({
      id: generateId(),
      category: '',
      title: '',
      description: '',
    });
  };

  const saveWorldSetting = () => {
    const setting = editingWorld();
    if (!setting) return;

    // 验证必填字段
    if (!setting.title.trim()) {
      alert('请输入设定标题');
      return;
    }

    updateSelectedNovel((novel) => {
      const exists = novel.worldSettings.find((w) => w.id === setting.id);
      return {
        ...novel,
        worldSettings: exists
          ? novel.worldSettings.map((w) => (w.id === setting.id ? setting : w))
          : [...novel.worldSettings, setting],
      };
    });
    setEditingWorld(null);
  };

  const deleteWorldSetting = (id: string) => {
    if (confirm('确定要删除这个设定吗？')) {
      updateSelectedNovel((novel) => ({
        ...novel,
        worldSettings: novel.worldSettings.filter((w) => w.id !== id),
      }));
    }
  };

  // ===== 人物关系网 =====
  const addRelationship = () => {
    setEditingRelationship({
      id: generateId(),
      from: '',
      to: '',
      relation: '',
      description: '',
    });
  };

  const saveRelationship = () => {
    const rel = editingRelationship();
    if (!rel) return;

    // 验证必填字段
    if (!rel.from.trim() || !rel.to.trim()) {
      alert('请输入两个人物名称');
      return;
    }
    if (!rel.relation.trim()) {
      alert('请输入关系类型');
      return;
    }

    updateSelectedNovel((novel) => {
      const exists = novel.relationships.find((r) => r.id === rel.id);
      return {
        ...novel,
        relationships: exists
          ? novel.relationships.map((r) => (r.id === rel.id ? rel : r))
          : [...novel.relationships, rel],
      };
    });
    setEditingRelationship(null);
  };

  const deleteRelationship = (id: string) => {
    if (confirm('确定要删除这个关系吗？')) {
      updateSelectedNovel((novel) => ({
        ...novel,
        relationships: novel.relationships.filter((r) => r.id !== id),
      }));
    }
  };

  // ===== 时间线 =====
  const addTimelineEvent = () => {
    setEditingTimeline({
      id: generateId(),
      time: '',
      title: '',
      description: '',
    });
  };

  const saveTimelineEvent = () => {
    const event = editingTimeline();
    if (!event) return;

    // 验证必填字段
    if (!event.title.trim()) {
      alert('请输入事件标题');
      return;
    }

    updateSelectedNovel((novel) => {
      const exists = novel.timeline.find((t) => t.id === event.id);
      return {
        ...novel,
        timeline: exists
          ? novel.timeline.map((t) => (t.id === event.id ? event : t))
          : [...novel.timeline, event],
      };
    });
    setEditingTimeline(null);
  };

  const deleteTimelineEvent = (id: string) => {
    if (confirm('确定要删除这个时间线事件吗？')) {
      updateSelectedNovel((novel) => ({
        ...novel,
        timeline: novel.timeline.filter((t) => t.id !== id),
      }));
    }
  };

  // ===== 章节梗概 =====
  const addOutline = () => {
    setEditingOutline({
      id: generateId(),
      chapter: '',
      title: '',
      content: '',
    });
  };

  const saveOutline = () => {
    const outline = editingOutline();
    if (!outline) return;

    // 验证必填字段
    if (!outline.chapter.trim()) {
      alert('请输入章节号');
      return;
    }
    if (!outline.title.trim()) {
      alert('请输入章节标题');
      return;
    }

    updateSelectedNovel((novel) => {
      const exists = novel.outlines.find((o) => o.id === outline.id);
      return {
        ...novel,
        outlines: exists
          ? novel.outlines.map((o) => (o.id === outline.id ? outline : o))
          : [...novel.outlines, outline],
      };
    });
    setEditingOutline(null);
  };

  const deleteOutline = (id: string) => {
    if (confirm('确定要删除这个章节梗概吗？')) {
      updateSelectedNovel((novel) => ({
        ...novel,
        outlines: novel.outlines.filter((o) => o.id !== id),
      }));
    }
  };

  // ===== 导出/导入 =====
  const exportData = () => {
    const data = novels();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novels-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 验证导入的数据结构
  const validateNovelData = (data: any): data is Novel[] => {
    if (!Array.isArray(data)) return false;

    return data.every((novel: any) => {
      return (
        typeof novel === 'object' &&
        typeof novel.id === 'string' &&
        typeof novel.title === 'string' &&
        typeof novel.createdAt === 'string' &&
        Array.isArray(novel.characters) &&
        Array.isArray(novel.worldSettings) &&
        Array.isArray(novel.relationships) &&
        Array.isArray(novel.timeline) &&
        Array.isArray(novel.outlines)
      );
    });
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);

            // 验证数据结构
            if (!validateNovelData(data)) {
              alert('导入失败,文件格式不正确。请确保导入的是有效的小说数据文件。');
              return;
            }

            if (confirm('导入将覆盖当前所有数据，确定继续吗？')) {
              setNovels(data);
              saveToStorage();
              alert('导入成功！');
            }
          } catch (err) {
            alert('导入失败，文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div class="flex h-[calc(100vh-12rem)] gap-4">
      {/* 左侧侧边栏 */}
      <div class="w-64 flex-shrink-0 space-y-4">
        {/* 创建小说按钮 */}
        <button
          onClick={createNovel}
          class="btn btn-primary btn-block gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          创建小说
        </button>

        {/* 搜索框 */}
        <div class="relative">
          <input
            type="text"
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            placeholder="搜索小说..."
            class="input input-bordered w-full pr-10"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* 书籍列表 */}
        <div class="space-y-2 overflow-y-auto" style="max-height: calc(100vh - 16rem);">
          <For each={filteredNovels()}>
            {(novel) => (
              <div
                class={`cursor-pointer rounded-lg border p-3 transition-all hover:bg-base-200 ${
                  selectedNovel()?.id === novel.id ? 'border-primary bg-base-200' : 'border-base-300'
                }`}
                onClick={() => {
                  // 如果点击的不是当前选中的小说,则切换到home模式
                  // 如果点击的是当前选中的小说,保持当前视图模式
                  if (selectedNovel()?.id !== novel.id) {
                    setSelectedNovel(novel);
                    setViewMode('home');
                  }
                }}
              >
                <div class="mb-1 flex items-start justify-between">
                  <h3 class="font-semibold line-clamp-1">{novel.title}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNovel(novel.id);
                    }}
                    class="btn btn-ghost btn-xs text-error"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                <p class="text-xs opacity-60">{novel.createdAt}</p>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* 主体内容 */}
      <div class="relative flex-1 overflow-hidden rounded-lg border border-base-300 bg-base-100">
        <Show when={!selectedNovel()}>
          <div class="flex h-full items-center justify-center text-base-content/60">
            <div class="text-center">
              <p class="mb-4 text-lg">选择一部小说开始创作</p>
              <p class="text-sm">或点击左侧的"创建小说"按钮新建小说</p>
            </div>
          </div>
        </Show>

        <Show when={selectedNovel() && viewMode() === 'home'}>
          <div class="h-full overflow-y-auto p-6">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-2xl font-bold">{selectedNovel()?.title}</h2>
              <div class="flex gap-2">
                <button onClick={exportData} class="btn btn-outline btn-sm">
                  导出
                </button>
                <button onClick={importData} class="btn btn-outline btn-sm">
                  导入
                </button>
                <button
                  onClick={() => setViewMode('detail')}
                  class="btn btn-primary btn-sm"
                >
                  详情
                </button>
              </div>
            </div>

            <div class="grid gap-6 md:grid-cols-2">
              {/* 角色列表 */}
              <div>
                <h3 class="mb-3 text-lg font-semibold">角色名单</h3>
                <div class="space-y-2">
                  <For each={selectedNovel()?.characters || []}>
                    {(char) => (
                      <div class="rounded-lg border border-base-300 bg-base-100 p-3">
                        <div class="font-semibold">{char.name || '未命名角色'}</div>
                        <div class="text-sm opacity-70">
                          {char.age} · {char.gender}
                        </div>
                      </div>
                    )}
                  </For>
                  <Show when={(selectedNovel()?.characters.length || 0) === 0}>
                    <div class="py-8 text-center text-sm text-base-content/60">
                      还没有添加角色
                    </div>
                  </Show>
                </div>
              </div>

              {/* 世界观 */}
              <div>
                <h3 class="mb-3 text-lg font-semibold">世界观</h3>
                <div class="space-y-2">
                  <For each={selectedNovel()?.worldSettings || []}>
                    {(setting) => (
                      <div class="rounded-lg border border-base-300 bg-base-100 p-3">
                        <div class="mb-1 flex items-center gap-2">
                          <span class="badge badge-secondary badge-sm">
                            {setting.category}
                          </span>
                          <span class="font-semibold">{setting.title}</span>
                        </div>
                        <p class="line-clamp-2 text-sm opacity-70">
                          {setting.description}
                        </p>
                      </div>
                    )}
                  </For>
                  <Show when={(selectedNovel()?.worldSettings.length || 0) === 0}>
                    <div class="py-8 text-center text-sm text-base-content/60">
                      还没有添加世界观设定
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          </div>
        </Show>

        <Show when={selectedNovel() && viewMode() === 'detail'}>
          <div class="flex h-full">
            {/* 详情页左侧侧边栏 */}
            <div class="w-64 flex-shrink-0 border-r border-base-300 bg-base-200 p-4">
              <div class="space-y-4">
                {/* 封面 */}
                <div class="aspect-[3/4] overflow-hidden rounded-lg border-2 border-base-300 bg-base-300">
                  <Show
                    when={selectedNovel()?.cover}
                    fallback={
                      <div class="flex h-full items-center justify-center text-base-content/40">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-16 w-16"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    }
                  >
                    <img
                      src={selectedNovel()?.cover}
                      alt="封面"
                      class="h-full w-full object-cover"
                    />
                  </Show>
                </div>

                {/* 书名 */}
                <div class="text-center">
                  <h2 class="text-xl font-bold">{selectedNovel()?.title}</h2>
                </div>

                {/* 简介 */}
                <div>
                  <h3 class="mb-2 text-sm font-semibold opacity-70">简介</h3>
                  <p class="text-sm leading-relaxed">
                    {selectedNovel()?.summary || '暂无简介'}
                  </p>
                </div>

                {/* 编辑按钮 */}
                <button
                  onClick={() => setEditingNovel(selectedNovel())}
                  class="btn btn-outline btn-block btn-sm"
                >
                  编辑基本信息
                </button>

                {/* 返回按钮 */}
                <button
                  onClick={() => setViewMode('home')}
                  class="btn btn-ghost btn-block btn-sm"
                >
                  返回首页
                </button>
              </div>
            </div>

            {/* 详情页主体 - 6个功能按钮 */}
            <div class="flex-1 overflow-y-auto p-8">
              <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <button
                  onClick={() => setActiveModal('background')}
                  class="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-orange-500/10 to-orange-600/10 p-6 transition-all hover:scale-105 hover:border-orange-500 hover:shadow-lg"
                >
                  <div class="flex h-full flex-col items-center justify-center">
                    <div class="mb-3 text-4xl">📖</div>
                    <h3 class="text-xl font-bold group-hover:text-orange-600">背景</h3>
                  </div>
                </button>

                <button
                  onClick={() => setActiveModal('characters')}
                  class="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-6 transition-all hover:scale-105 hover:border-blue-500 hover:shadow-lg"
                >
                  <div class="flex h-full flex-col items-center justify-center">
                    <div class="mb-3 text-4xl">👥</div>
                    <h3 class="text-xl font-bold group-hover:text-blue-600">人物详情</h3>
                  </div>
                </button>

                <button
                  onClick={() => setActiveModal('relationships')}
                  class="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 transition-all hover:scale-105 hover:border-purple-500 hover:shadow-lg"
                >
                  <div class="flex h-full flex-col items-center justify-center">
                    <div class="mb-3 text-4xl">🔗</div>
                    <h3 class="text-xl font-bold group-hover:text-purple-600">
                      人物关系网
                    </h3>
                  </div>
                </button>

                <button
                  onClick={() => setActiveModal('worldview')}
                  class="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-green-500/10 to-green-600/10 p-6 transition-all hover:scale-105 hover:border-green-500 hover:shadow-lg"
                >
                  <div class="flex h-full flex-col items-center justify-center">
                    <div class="mb-3 text-4xl">🌍</div>
                    <h3 class="text-xl font-bold group-hover:text-green-600">世界设定</h3>
                  </div>
                </button>

                <button
                  onClick={() => setActiveModal('timeline')}
                  class="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-pink-500/10 to-pink-600/10 p-6 transition-all hover:scale-105 hover:border-pink-500 hover:shadow-lg"
                >
                  <div class="flex h-full flex-col items-center justify-center">
                    <div class="mb-3 text-4xl">⏰</div>
                    <h3 class="text-xl font-bold group-hover:text-pink-600">时间线</h3>
                  </div>
                </button>

                <button
                  onClick={() => setActiveModal('outline')}
                  class="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-6 transition-all hover:scale-105 hover:border-yellow-500 hover:shadow-lg"
                >
                  <div class="flex h-full flex-col items-center justify-center">
                    <div class="mb-3 text-4xl">📝</div>
                    <h3 class="text-xl font-bold group-hover:text-yellow-600">
                      章节梗概
                    </h3>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </Show>
      </div>

      {/* ===== 模态框们 ===== */}

      {/* 小说基本信息编辑模态框 */}
      <Show when={editingNovel()}>
        {(novel) => (
          <div class="modal modal-open">
            <div class="modal-box max-w-2xl">
              <h3 class="mb-4 text-lg font-bold">编辑小说信息</h3>
              <div class="space-y-3">
                <div>
                  <label class="label">
                    <span class="label-text">书名</span>
                  </label>
                  <input
                    type="text"
                    value={novel().title || ''}
                    onInput={(e) =>
                      setEditingNovel({ ...novel(), title: e.currentTarget.value })
                    }
                    class="input input-bordered w-full"
                    placeholder="输入书名"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">封面图片URL</span>
                  </label>
                  <input
                    type="text"
                    value={novel().cover || ''}
                    onInput={(e) =>
                      setEditingNovel({ ...novel(), cover: e.currentTarget.value })
                    }
                    class="input input-bordered w-full"
                    placeholder="输入封面图片URL"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">简介</span>
                  </label>
                  <textarea
                    value={novel().summary || ''}
                    onInput={(e) =>
                      setEditingNovel({ ...novel(), summary: e.currentTarget.value })
                    }
                    class="textarea textarea-bordered w-full"
                    rows="4"
                    placeholder="输入简介"
                  />
                </div>
              </div>
              <div class="modal-action">
                <button onClick={() => setEditingNovel(null)} class="btn btn-ghost">
                  取消
                </button>
                <button onClick={saveNovelInfo} class="btn btn-primary">
                  保存
                </button>
              </div>
            </div>
            <div class="modal-backdrop" onClick={() => setEditingNovel(null)}></div>
          </div>
        )}
      </Show>

      {/* 背景模态框 */}
      <Show when={activeModal() === 'background'}>
        <div class="modal modal-open">
          <div class="modal-box max-w-4xl">
            <h3 class="mb-4 text-lg font-bold">故事背景</h3>
            <textarea
              value={selectedNovel()?.background || ''}
              onInput={(e) =>
                updateSelectedNovel((novel) => ({
                  ...novel,
                  background: e.currentTarget.value,
                }))
              }
              class="textarea textarea-bordered w-full"
              rows="15"
              placeholder="描述故事的整体背景、时代背景、地点等..."
            />
            <div class="modal-action">
              <button onClick={() => setActiveModal(null)} class="btn btn-primary">
                完成
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick={() => setActiveModal(null)}></div>
        </div>
      </Show>

      {/* 人物详情模态框 */}
      <Show when={activeModal() === 'characters'}>
        <div class="modal modal-open">
          <div class="modal-box max-w-6xl h-[80vh]">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold">人物详情</h3>
              <button onClick={addCharacter} class="btn btn-primary btn-sm">
                + 添加角色
              </button>
            </div>
            <div class="h-[calc(100%-8rem)] overflow-y-auto">
              <div class="grid gap-4 md:grid-cols-2">
                <For each={selectedNovel()?.characters || []}>
                  {(char) => (
                    <div class="card border border-base-300 bg-base-100 shadow-sm">
                      <div class="card-body p-4">
                        <h3 class="card-title text-lg">{char.name || '未命名角色'}</h3>
                        <div class="space-y-1 text-sm">
                          <p>
                            <span class="font-semibold">年龄:</span> {char.age || '-'}
                          </p>
                          <p>
                            <span class="font-semibold">性别:</span> {char.gender || '-'}
                          </p>
                          <p>
                            <span class="font-semibold">性格:</span>{' '}
                            {char.personality || '-'}
                          </p>
                          <p class="line-clamp-2">
                            <span class="font-semibold">详细描述:</span>{' '}
                            {char.description || '-'}
                          </p>
                        </div>
                        <div class="card-actions mt-3 justify-end">
                          <button
                            onClick={() => setEditingCharacter(char)}
                            class="btn btn-ghost btn-xs"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => deleteCharacter(char.id)}
                            class="btn btn-error btn-ghost btn-xs"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <Show when={(selectedNovel()?.characters.length || 0) === 0}>
                <div class="py-16 text-center text-base-content/60">
                  还没有添加角色，点击右上角按钮开始创建吧！
                </div>
              </Show>
            </div>
            <div class="modal-action">
              <button onClick={() => setActiveModal(null)} class="btn">
                关闭
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick={() => setActiveModal(null)}></div>
        </div>
      </Show>

      {/* 人物关系网模态框 */}
      <Show when={activeModal() === 'relationships'}>
        <div class="modal modal-open">
          <div class="modal-box max-w-6xl h-[80vh]">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold">人物关系网</h3>
              <button onClick={addRelationship} class="btn btn-primary btn-sm">
                + 添加关系
              </button>
            </div>
            <div class="h-[calc(100%-8rem)] overflow-y-auto">
              <div class="space-y-3">
                <For each={selectedNovel()?.relationships || []}>
                  {(rel) => (
                    <div class="card border border-base-300 bg-base-100 shadow-sm">
                      <div class="card-body p-4">
                        <div class="flex items-center gap-3">
                          <div class="rounded-lg bg-primary/10 px-3 py-1 font-semibold">
                            {rel.from || '?'}
                          </div>
                          <div class="flex-1 text-center">
                            <div class="badge badge-secondary">{rel.relation || '关系'}</div>
                          </div>
                          <div class="rounded-lg bg-primary/10 px-3 py-1 font-semibold">
                            {rel.to || '?'}
                          </div>
                          <div class="flex gap-1">
                            <button
                              onClick={() => setEditingRelationship(rel)}
                              class="btn btn-ghost btn-xs"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => deleteRelationship(rel.id)}
                              class="btn btn-error btn-ghost btn-xs"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                        <Show when={rel.description}>
                          <p class="mt-2 text-sm text-base-content/70">{rel.description}</p>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <Show when={(selectedNovel()?.relationships.length || 0) === 0}>
                <div class="py-16 text-center text-base-content/60">
                  还没有添加人物关系，点击右上角按钮开始创建吧！
                </div>
              </Show>
            </div>
            <div class="modal-action">
              <button onClick={() => setActiveModal(null)} class="btn">
                关闭
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick={() => setActiveModal(null)}></div>
        </div>
      </Show>

      {/* 世界设定模态框 */}
      <Show when={activeModal() === 'worldview'}>
        <div class="modal modal-open">
          <div class="modal-box max-w-6xl h-[80vh]">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold">世界设定</h3>
              <button onClick={addWorldSetting} class="btn btn-primary btn-sm">
                + 添加设定
              </button>
            </div>
            <div class="h-[calc(100%-8rem)] overflow-y-auto">
              <div class="grid gap-4 md:grid-cols-2">
                <For each={selectedNovel()?.worldSettings || []}>
                  {(setting) => (
                    <div class="card border border-base-300 bg-base-100 shadow-sm">
                      <div class="card-body p-4">
                        <div class="mb-2 flex items-center gap-2">
                          <span class="badge badge-secondary">{setting.category}</span>
                          <h3 class="text-lg font-semibold">{setting.title}</h3>
                        </div>
                        <p class="whitespace-pre-wrap text-sm text-base-content/80">
                          {setting.description}
                        </p>
                        <div class="card-actions mt-3 justify-end">
                          <button
                            onClick={() => setEditingWorld(setting)}
                            class="btn btn-ghost btn-xs"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => deleteWorldSetting(setting.id)}
                            class="btn btn-error btn-ghost btn-xs"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <Show when={(selectedNovel()?.worldSettings.length || 0) === 0}>
                <div class="py-16 text-center text-base-content/60">
                  还没有添加世界设定，点击右上角按钮开始创建吧！
                </div>
              </Show>
            </div>
            <div class="modal-action">
              <button onClick={() => setActiveModal(null)} class="btn">
                关闭
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick={() => setActiveModal(null)}></div>
        </div>
      </Show>

      {/* 时间线模态框 */}
      <Show when={activeModal() === 'timeline'}>
        <div class="modal modal-open">
          <div class="modal-box max-w-4xl h-[80vh]">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold">时间线</h3>
              <button onClick={addTimelineEvent} class="btn btn-primary btn-sm">
                + 添加事件
              </button>
            </div>
            <div class="h-[calc(100%-8rem)] overflow-y-auto">
              <div class="space-y-4">
                <For each={selectedNovel()?.timeline || []}>
                  {(event) => (
                    <div class="relative pl-8">
                      <div class="absolute left-0 top-2 h-4 w-4 rounded-full bg-primary"></div>
                      <div class="absolute left-2 top-6 h-full w-px bg-base-300"></div>
                      <div class="card border border-base-300 bg-base-100 shadow-sm">
                        <div class="card-body p-4">
                          <div class="mb-2 flex items-center justify-between">
                            <div class="badge badge-primary">{event.time || '时间'}</div>
                            <div class="flex gap-1">
                              <button
                                onClick={() => setEditingTimeline(event)}
                                class="btn btn-ghost btn-xs"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => deleteTimelineEvent(event.id)}
                                class="btn btn-error btn-ghost btn-xs"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                          <h3 class="font-semibold">{event.title || '未命名事件'}</h3>
                          <p class="text-sm text-base-content/70">{event.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <Show when={(selectedNovel()?.timeline.length || 0) === 0}>
                <div class="py-16 text-center text-base-content/60">
                  还没有添加时间线事件，点击右上角按钮开始创建吧！
                </div>
              </Show>
            </div>
            <div class="modal-action">
              <button onClick={() => setActiveModal(null)} class="btn">
                关闭
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick={() => setActiveModal(null)}></div>
        </div>
      </Show>

      {/* 章节梗概模态框 */}
      <Show when={activeModal() === 'outline'}>
        <div class="modal modal-open">
          <div class="modal-box max-w-6xl h-[80vh]">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-bold">章节梗概</h3>
              <button onClick={addOutline} class="btn btn-primary btn-sm">
                + 添加章节
              </button>
            </div>
            <div class="h-[calc(100%-8rem)] overflow-y-auto">
              <div class="space-y-3">
                <For each={selectedNovel()?.outlines || []}>
                  {(outline) => (
                    <div class="card border border-base-300 bg-base-100 shadow-sm">
                      <div class="card-body p-4">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <div class="mb-2 flex items-center gap-2">
                              <span class="badge badge-primary">{outline.chapter}</span>
                              <h3 class="text-lg font-semibold">{outline.title}</h3>
                            </div>
                            <p class="whitespace-pre-wrap text-sm text-base-content/80">
                              {outline.content}
                            </p>
                          </div>
                          <div class="ml-4 flex gap-1">
                            <button
                              onClick={() => setEditingOutline(outline)}
                              class="btn btn-ghost btn-xs"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => deleteOutline(outline.id)}
                              class="btn btn-error btn-ghost btn-xs"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <Show when={(selectedNovel()?.outlines.length || 0) === 0}>
                <div class="py-16 text-center text-base-content/60">
                  还没有添加章节梗概，点击右上角按钮开始创建吧！
                </div>
              </Show>
            </div>
            <div class="modal-action">
              <button onClick={() => setActiveModal(null)} class="btn">
                关闭
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick={() => setActiveModal(null)}></div>
        </div>
      </Show>

      {/* 角色编辑模态框 */}
      <Show when={editingCharacter()}>
        {(char) => (
          <div class="modal modal-open">
            <div class="modal-box max-w-2xl">
              <h3 class="mb-4 text-lg font-bold">编辑角色</h3>
              <div class="space-y-3">
                <div>
                  <label class="label">
                    <span class="label-text">姓名</span>
                  </label>
                  <input
                    type="text"
                    value={char().name}
                    onInput={(e) =>
                      setEditingCharacter({ ...char(), name: e.currentTarget.value })
                    }
                    class="input input-bordered w-full"
                    placeholder="角色姓名"
                  />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">
                      <span class="label-text">年龄</span>
                    </label>
                    <input
                      type="text"
                      value={char().age}
                      onInput={(e) =>
                        setEditingCharacter({ ...char(), age: e.currentTarget.value })
                      }
                      class="input input-bordered w-full"
                      placeholder="年龄"
                    />
                  </div>
                  <div>
                    <label class="label">
                      <span class="label-text">性别</span>
                    </label>
                    <input
                      type="text"
                      value={char().gender}
                      onInput={(e) =>
                        setEditingCharacter({ ...char(), gender: e.currentTarget.value })
                      }
                      class="input input-bordered w-full"
                      placeholder="性别"
                    />
                  </div>
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">性格</span>
                  </label>
                  <input
                    type="text"
                    value={char().personality}
                    onInput={(e) =>
                      setEditingCharacter({
                        ...char(),
                        personality: e.currentTarget.value,
                      })
                    }
                    class="input input-bordered w-full"
                    placeholder="性格特点"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">背景故事</span>
                  </label>
                  <textarea
                    value={char().background}
                    onInput={(e) =>
                      setEditingCharacter({
                        ...char(),
                        background: e.currentTarget.value,
                      })
                    }
                    class="textarea textarea-bordered w-full"
                    rows="3"
                    placeholder="角色背景故事"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">详细描述</span>
                  </label>
                  <textarea
                    value={char().description}
                    onInput={(e) =>
                      setEditingCharacter({
                        ...char(),
                        description: e.currentTarget.value,
                      })
                    }
                    class="textarea textarea-bordered w-full"
                    rows="4"
                    placeholder="角色的详细描述"
                  />
                </div>
              </div>
              <div class="modal-action">
                <button onClick={() => setEditingCharacter(null)} class="btn btn-ghost">
                  取消
                </button>
                <button onClick={saveCharacter} class="btn btn-primary">
                  保存
                </button>
              </div>
            </div>
            <div class="modal-backdrop" onClick={() => setEditingCharacter(null)}></div>
          </div>
        )}
      </Show>

      {/* 世界观设定编辑模态框 */}
      <Show when={editingWorld()}>
        {(setting) => (
          <div class="modal modal-open">
            <div class="modal-box max-w-2xl">
              <h3 class="mb-4 text-lg font-bold">编辑世界观设定</h3>
              <div class="space-y-3">
                <div>
                  <label class="label">
                    <span class="label-text">分类</span>
                  </label>
                  <input
                    type="text"
                    value={setting().category}
                    onInput={(e) =>
                      setEditingWorld({ ...setting(), category: e.currentTarget.value })
                    }
                    class="input input-bordered w-full"
                    placeholder="如: 地理、历史、魔法体系等"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">标题</span>
                  </label>
                  <input
                    type="text"
                    value={setting().title}
                    onInput={(e) =>
                      setEditingWorld({ ...setting(), title: e.currentTarget.value })
                    }
                    class="input input-bordered w-full"
                    placeholder="设定标题"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">详细描述</span>
                  </label>
                  <textarea
                    value={setting().description}
                    onInput={(e) =>
                      setEditingWorld({
                        ...setting(),
                        description: e.currentTarget.value,
                      })
                    }
                    class="textarea textarea-bordered w-full"
                    rows="8"
                    placeholder="详细描述世界观设定"
                  />
                </div>
              </div>
              <div class="modal-action">
                <button onClick={() => setEditingWorld(null)} class="btn btn-ghost">
                  取消
                </button>
                <button onClick={saveWorldSetting} class="btn btn-primary">
                  保存
                </button>
              </div>
            </div>
            <div class="modal-backdrop" onClick={() => setEditingWorld(null)}></div>
          </div>
        )}
      </Show>

      {/* 人物关系编辑模态框 */}
      <Show when={editingRelationship()}>
        {(rel) => (
          <div class="modal modal-open">
            <div class="modal-box max-w-2xl">
              <h3 class="mb-4 text-lg font-bold">编辑人物关系</h3>
              <div class="space-y-3">
                <Show when={(selectedNovel()?.characters.length || 0) === 0}>
                  <div class="alert alert-warning">
                    <span>还没有添加角色，请先在"人物详情"中添加角色</span>
                  </div>
                </Show>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">
                      <span class="label-text">人物A</span>
                    </label>
                    <select
                      value={rel().from}
                      onChange={(e) =>
                        setEditingRelationship({ ...rel(), from: e.currentTarget.value })
                      }
                      class="select select-bordered w-full"
                    >
                      <option value="">请选择人物</option>
                      <For each={selectedNovel()?.characters || []}>
                        {(char) => <option value={char.name}>{char.name}</option>}
                      </For>
                    </select>
                  </div>
                  <div>
                    <label class="label">
                      <span class="label-text">人物B</span>
                    </label>
                    <select
                      value={rel().to}
                      onChange={(e) =>
                        setEditingRelationship({ ...rel(), to: e.currentTarget.value })
                      }
                      class="select select-bordered w-full"
                    >
                      <option value="">请选择人物</option>
                      <For each={selectedNovel()?.characters || []}>
                        {(char) => <option value={char.name}>{char.name}</option>}
                      </For>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">关系</span>
                  </label>
                  <input
                    type="text"
                    value={rel().relation}
                    onInput={(e) =>
                      setEditingRelationship({ ...rel(), relation: e.currentTarget.value })
                    }
                    class="input input-bordered w-full"
                    placeholder="如: 父子、朋友、敌人等"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">详细说明</span>
                  </label>
                  <textarea
                    value={rel().description}
                    onInput={(e) =>
                      setEditingRelationship({
                        ...rel(),
                        description: e.currentTarget.value,
                      })
                    }
                    class="textarea textarea-bordered w-full"
                    rows="4"
                    placeholder="详细说明关系"
                  />
                </div>
              </div>
              <div class="modal-action">
                <button onClick={() => setEditingRelationship(null)} class="btn btn-ghost">
                  取消
                </button>
                <button onClick={saveRelationship} class="btn btn-primary">
                  保存
                </button>
              </div>
            </div>
            <div
              class="modal-backdrop"
              onClick={() => setEditingRelationship(null)}
            ></div>
          </div>
        )}
      </Show>

      {/* 时间线事件编辑模态框 */}
      <Show when={editingTimeline()}>
        {(event) => (
          <div class="modal modal-open">
            <div class="modal-box max-w-2xl">
              <h3 class="mb-4 text-lg font-bold">编辑时间线事件</h3>
              <div class="space-y-3">
                <div>
                  <label class="label">
                    <span class="label-text">时间</span>
                  </label>
                  <input
                    type="text"
                    value={event().time}
                    onInput={(e) =>
                      setEditingTimeline({ ...event(), time: e.currentTarget.value })
                    }
                    class="input input-bordered w-full"
                    placeholder="如: 2024年1月、第一章"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">事件标题</span>
                  </label>
                  <input
                    type="text"
                    value={event().title}
                    onInput={(e) =>
                      setEditingTimeline({ ...event(), title: e.currentTarget.value })
                    }
                    class="input input-bordered w-full"
                    placeholder="事件标题"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">事件描述</span>
                  </label>
                  <textarea
                    value={event().description}
                    onInput={(e) =>
                      setEditingTimeline({
                        ...event(),
                        description: e.currentTarget.value,
                      })
                    }
                    class="textarea textarea-bordered w-full"
                    rows="6"
                    placeholder="详细描述事件"
                  />
                </div>
              </div>
              <div class="modal-action">
                <button onClick={() => setEditingTimeline(null)} class="btn btn-ghost">
                  取消
                </button>
                <button onClick={saveTimelineEvent} class="btn btn-primary">
                  保存
                </button>
              </div>
            </div>
            <div class="modal-backdrop" onClick={() => setEditingTimeline(null)}></div>
          </div>
        )}
      </Show>

      {/* 章节梗概编辑模态框 */}
      <Show when={editingOutline()}>
        {(outline) => (
          <div class="modal modal-open">
            <div class="modal-box max-w-2xl">
              <h3 class="mb-4 text-lg font-bold">编辑章节梗概</h3>
              <div class="space-y-3">
                <div>
                  <label class="label">
                    <span class="label-text">章节号</span>
                  </label>
                  <input
                    type="text"
                    value={outline().chapter}
                    onInput={(e) =>
                      setEditingOutline({ ...outline(), chapter: e.currentTarget.value })
                    }
                    class="input input-bordered w-full"
                    placeholder="如: 第一章"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">章节标题</span>
                  </label>
                  <input
                    type="text"
                    value={outline().title}
                    onInput={(e) =>
                      setEditingOutline({ ...outline(), title: e.currentTarget.value })
                    }
                    class="input input-bordered w-full"
                    placeholder="章节标题"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">章节内容/梗概</span>
                  </label>
                  <textarea
                    value={outline().content}
                    onInput={(e) =>
                      setEditingOutline({ ...outline(), content: e.currentTarget.value })
                    }
                    class="textarea textarea-bordered w-full"
                    rows="10"
                    placeholder="章节梗概或详细内容"
                  />
                </div>
              </div>
              <div class="modal-action">
                <button onClick={() => setEditingOutline(null)} class="btn btn-ghost">
                  取消
                </button>
                <button onClick={saveOutline} class="btn btn-primary">
                  保存
                </button>
              </div>
            </div>
            <div class="modal-backdrop" onClick={() => setEditingOutline(null)}></div>
          </div>
        )}
      </Show>
    </div>
  );
}
