import { createSignal, For, Show } from 'solid-js';

// 定义数据类型
interface Character {
  id: string;
  name: string;
  age: string;
  gender: string;
  personality: string;
  background: string;
}

interface OutlineItem {
  id: string;
  chapter: string;
  title: string;
  content: string;
}

interface WorldSetting {
  id: string;
  category: string;
  title: string;
  description: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: string;
}

type TabType = 'characters' | 'outline' | 'worldview' | 'notes';

export default function NovelDesigner() {
  // 当前激活的标签页
  const [activeTab, setActiveTab] = createSignal<TabType>('characters');

  // 角色管理
  const [characters, setCharacters] = createSignal<Character[]>([]);
  const [editingCharacter, setEditingCharacter] = createSignal<Character | null>(null);

  // 大纲编辑
  const [outline, setOutline] = createSignal<OutlineItem[]>([]);
  const [editingOutline, setEditingOutline] = createSignal<OutlineItem | null>(null);

  // 世界观设定
  const [worldSettings, setWorldSettings] = createSignal<WorldSetting[]>([]);
  const [editingWorld, setEditingWorld] = createSignal<WorldSetting | null>(null);

  // 灵感笔记
  const [notes, setNotes] = createSignal<Note[]>([]);
  const [editingNote, setEditingNote] = createSignal<Note | null>(null);

  // 从 localStorage 加载数据
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('novel-designer-data');
      if (stored) {
        const data = JSON.parse(stored);
        setCharacters(data.characters || []);
        setOutline(data.outline || []);
        setWorldSettings(data.worldSettings || []);
        setNotes(data.notes || []);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  // 保存到 localStorage
  const saveToStorage = () => {
    const data = {
      characters: characters(),
      outline: outline(),
      worldSettings: worldSettings(),
      notes: notes(),
    };
    localStorage.setItem('novel-designer-data', JSON.stringify(data));
  };

  // 初始化时加载数据
  setTimeout(loadFromStorage, 0);

  // ===== 角色管理功能 =====
  const addCharacter = () => {
    const newChar: Character = {
      id: Date.now().toString(),
      name: '',
      age: '',
      gender: '',
      personality: '',
      background: '',
    };
    setEditingCharacter(newChar);
  };

  const saveCharacter = (char: Character) => {
    const existing = characters().find((c) => c.id === char.id);
    if (existing) {
      setCharacters(characters().map((c) => (c.id === char.id ? char : c)));
    } else {
      setCharacters([...characters(), char]);
    }
    setEditingCharacter(null);
    saveToStorage();
  };

  const deleteCharacter = (id: string) => {
    if (confirm('确定要删除这个角色吗?')) {
      setCharacters(characters().filter((c) => c.id !== id));
      saveToStorage();
    }
  };

  // ===== 大纲编辑功能 =====
  const addOutlineItem = () => {
    const newItem: OutlineItem = {
      id: Date.now().toString(),
      chapter: '',
      title: '',
      content: '',
    };
    setEditingOutline(newItem);
  };

  const saveOutlineItem = (item: OutlineItem) => {
    const existing = outline().find((o) => o.id === item.id);
    if (existing) {
      setOutline(outline().map((o) => (o.id === item.id ? item : o)));
    } else {
      setOutline([...outline(), item]);
    }
    setEditingOutline(null);
    saveToStorage();
  };

  const deleteOutlineItem = (id: string) => {
    if (confirm('确定要删除这个大纲项吗?')) {
      setOutline(outline().filter((o) => o.id !== id));
      saveToStorage();
    }
  };

  // ===== 世界观设定功能 =====
  const addWorldSetting = () => {
    const newSetting: WorldSetting = {
      id: Date.now().toString(),
      category: '',
      title: '',
      description: '',
    };
    setEditingWorld(newSetting);
  };

  const saveWorldSetting = (setting: WorldSetting) => {
    const existing = worldSettings().find((w) => w.id === setting.id);
    if (existing) {
      setWorldSettings(worldSettings().map((w) => (w.id === setting.id ? setting : w)));
    } else {
      setWorldSettings([...worldSettings(), setting]);
    }
    setEditingWorld(null);
    saveToStorage();
  };

  const deleteWorldSetting = (id: string) => {
    if (confirm('确定要删除这个设定吗?')) {
      setWorldSettings(worldSettings().filter((w) => w.id !== id));
      saveToStorage();
    }
  };

  // ===== 灵感笔记功能 =====
  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      timestamp: new Date().toLocaleString('zh-CN'),
    };
    setEditingNote(newNote);
  };

  const saveNote = (note: Note) => {
    const existing = notes().find((n) => n.id === note.id);
    if (existing) {
      setNotes(notes().map((n) => (n.id === note.id ? note : n)));
    } else {
      setNotes([...notes(), note]);
    }
    setEditingNote(null);
    saveToStorage();
  };

  const deleteNote = (id: string) => {
    if (confirm('确定要删除这条笔记吗?')) {
      setNotes(notes().filter((n) => n.id !== id));
      saveToStorage();
    }
  };

  // ===== 导出功能 =====
  const exportData = () => {
    const data = {
      characters: characters(),
      outline: outline(),
      worldSettings: worldSettings(),
      notes: notes(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novel-design-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== 导入功能 =====
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
            if (confirm('导入将覆盖当前数据,确定继续吗?')) {
              setCharacters(data.characters || []);
              setOutline(data.outline || []);
              setWorldSettings(data.worldSettings || []);
              setNotes(data.notes || []);
              saveToStorage();
              alert('导入成功!');
            }
          } catch (err) {
            alert('导入失败,文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div class="w-full">
      {/* 顶部操作栏 */}
      <div class="mb-6 flex justify-end gap-2">
        <button onClick={exportData} class="btn btn-sm btn-outline gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          导出数据
        </button>
        <button onClick={importData} class="btn btn-sm btn-outline gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          导入数据
        </button>
      </div>

      {/* 标签页导航 */}
      <div class="tabs tabs-boxed mb-6 bg-base-200 p-1">
        <button
          class={`tab ${activeTab() === 'characters' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('characters')}
        >
          角色管理
        </button>
        <button
          class={`tab ${activeTab() === 'outline' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('outline')}
        >
          大纲编辑
        </button>
        <button
          class={`tab ${activeTab() === 'worldview' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('worldview')}
        >
          世界观设定
        </button>
        <button
          class={`tab ${activeTab() === 'notes' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          灵感笔记
        </button>
      </div>

      {/* 标签页内容 */}
      <div class="min-h-[500px]">
        {/* 角色管理标签页 */}
        <Show when={activeTab() === 'characters'}>
          <div>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-2xl font-bold">角色管理</h2>
              <button onClick={addCharacter} class="btn btn-primary btn-sm">
                + 添加角色
              </button>
            </div>

            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <For each={characters()}>
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
                          <span class="font-semibold">性格:</span> {char.personality || '-'}
                        </p>
                        <p class="line-clamp-2">
                          <span class="font-semibold">背景:</span> {char.background || '-'}
                        </p>
                      </div>
                      <div class="card-actions mt-3 justify-end">
                        <button onClick={() => setEditingCharacter(char)} class="btn btn-ghost btn-xs">
                          编辑
                        </button>
                        <button onClick={() => deleteCharacter(char.id)} class="btn btn-error btn-ghost btn-xs">
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>

            <Show when={characters().length === 0}>
              <div class="py-16 text-center text-base-content/60">
                <p>还没有添加角色,点击右上角按钮开始创建吧!</p>
              </div>
            </Show>
          </div>
        </Show>

        {/* 大纲编辑标签页 */}
        <Show when={activeTab() === 'outline'}>
          <div>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-2xl font-bold">大纲编辑</h2>
              <button onClick={addOutlineItem} class="btn btn-primary btn-sm">
                + 添加章节
              </button>
            </div>

            <div class="space-y-3">
              <For each={outline()}>
                {(item) => (
                  <div class="card border border-base-300 bg-base-100 shadow-sm">
                    <div class="card-body p-4">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="mb-2 flex items-center gap-2">
                            <span class="badge badge-primary">{item.chapter || '章节号'}</span>
                            <h3 class="text-lg font-semibold">{item.title || '未命名章节'}</h3>
                          </div>
                          <p class="whitespace-pre-wrap text-sm text-base-content/80">{item.content || '暂无内容'}</p>
                        </div>
                        <div class="ml-4 flex gap-1">
                          <button onClick={() => setEditingOutline(item)} class="btn btn-ghost btn-xs">
                            编辑
                          </button>
                          <button onClick={() => deleteOutlineItem(item.id)} class="btn btn-error btn-ghost btn-xs">
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>

            <Show when={outline().length === 0}>
              <div class="py-16 text-center text-base-content/60">
                <p>还没有添加大纲,点击右上角按钮开始规划吧!</p>
              </div>
            </Show>
          </div>
        </Show>

        {/* 世界观设定标签页 */}
        <Show when={activeTab() === 'worldview'}>
          <div>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-2xl font-bold">世界观设定</h2>
              <button onClick={addWorldSetting} class="btn btn-primary btn-sm">
                + 添加设定
              </button>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <For each={worldSettings()}>
                {(setting) => (
                  <div class="card border border-base-300 bg-base-100 shadow-sm">
                    <div class="card-body p-4">
                      <div class="mb-2 flex items-center gap-2">
                        <span class="badge badge-secondary">{setting.category || '分类'}</span>
                        <h3 class="text-lg font-semibold">{setting.title || '未命名设定'}</h3>
                      </div>
                      <p class="whitespace-pre-wrap text-sm text-base-content/80">{setting.description || '暂无描述'}</p>
                      <div class="card-actions mt-3 justify-end">
                        <button onClick={() => setEditingWorld(setting)} class="btn btn-ghost btn-xs">
                          编辑
                        </button>
                        <button onClick={() => deleteWorldSetting(setting.id)} class="btn btn-error btn-ghost btn-xs">
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>

            <Show when={worldSettings().length === 0}>
              <div class="py-16 text-center text-base-content/60">
                <p>还没有添加世界观设定,点击右上角按钮开始构建吧!</p>
              </div>
            </Show>
          </div>
        </Show>

        {/* 灵感笔记标签页 */}
        <Show when={activeTab() === 'notes'}>
          <div>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-2xl font-bold">灵感笔记</h2>
              <button onClick={addNote} class="btn btn-primary btn-sm">
                + 添加笔记
              </button>
            </div>

            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <For each={notes()}>
                {(note) => (
                  <div class="card border border-base-300 bg-base-100 shadow-sm">
                    <div class="card-body p-4">
                      <h3 class="card-title text-lg">{note.title || '未命名笔记'}</h3>
                      <p class="line-clamp-3 text-sm text-base-content/80">{note.content || '暂无内容'}</p>
                      <div class="mt-2 text-xs text-base-content/50">{note.timestamp}</div>
                      <div class="card-actions mt-3 justify-end">
                        <button onClick={() => setEditingNote(note)} class="btn btn-ghost btn-xs">
                          编辑
                        </button>
                        <button onClick={() => deleteNote(note.id)} class="btn btn-error btn-ghost btn-xs">
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>

            <Show when={notes().length === 0}>
              <div class="py-16 text-center text-base-content/60">
                <p>还没有添加灵感笔记,点击右上角按钮开始记录吧!</p>
              </div>
            </Show>
          </div>
        </Show>
      </div>

      {/* 角色编辑模态框 */}
      <Show when={editingCharacter()}>
        {(char) => (
          <div class="modal modal-open">
            <div class="modal-box max-w-2xl">
              <h3 class="text-lg font-bold">编辑角色</h3>
              <div class="py-4 space-y-3">
                <div>
                  <label class="label">
                    <span class="label-text">姓名</span>
                  </label>
                  <input
                    type="text"
                    value={char().name}
                    onInput={(e) => setEditingCharacter({ ...char(), name: e.currentTarget.value })}
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
                      onInput={(e) => setEditingCharacter({ ...char(), age: e.currentTarget.value })}
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
                      onInput={(e) => setEditingCharacter({ ...char(), gender: e.currentTarget.value })}
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
                    onInput={(e) => setEditingCharacter({ ...char(), personality: e.currentTarget.value })}
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
                    onInput={(e) => setEditingCharacter({ ...char(), background: e.currentTarget.value })}
                    class="textarea textarea-bordered w-full"
                    rows="4"
                    placeholder="角色背景故事"
                  />
                </div>
              </div>
              <div class="modal-action">
                <button onClick={() => setEditingCharacter(null)} class="btn btn-ghost">
                  取消
                </button>
                <button onClick={() => saveCharacter(char())} class="btn btn-primary">
                  保存
                </button>
              </div>
            </div>
            <div class="modal-backdrop" onClick={() => setEditingCharacter(null)}></div>
          </div>
        )}
      </Show>

      {/* 大纲编辑模态框 */}
      <Show when={editingOutline()}>
        {(item) => (
          <div class="modal modal-open">
            <div class="modal-box max-w-2xl">
              <h3 class="text-lg font-bold">编辑大纲</h3>
              <div class="py-4 space-y-3">
                <div>
                  <label class="label">
                    <span class="label-text">章节号</span>
                  </label>
                  <input
                    type="text"
                    value={item().chapter}
                    onInput={(e) => setEditingOutline({ ...item(), chapter: e.currentTarget.value })}
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
                    value={item().title}
                    onInput={(e) => setEditingOutline({ ...item(), title: e.currentTarget.value })}
                    class="input input-bordered w-full"
                    placeholder="章节标题"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">章节内容/大纲</span>
                  </label>
                  <textarea
                    value={item().content}
                    onInput={(e) => setEditingOutline({ ...item(), content: e.currentTarget.value })}
                    class="textarea textarea-bordered w-full"
                    rows="8"
                    placeholder="章节大纲或详细内容"
                  />
                </div>
              </div>
              <div class="modal-action">
                <button onClick={() => setEditingOutline(null)} class="btn btn-ghost">
                  取消
                </button>
                <button onClick={() => saveOutlineItem(item())} class="btn btn-primary">
                  保存
                </button>
              </div>
            </div>
            <div class="modal-backdrop" onClick={() => setEditingOutline(null)}></div>
          </div>
        )}
      </Show>

      {/* 世界观设定编辑模态框 */}
      <Show when={editingWorld()}>
        {(setting) => (
          <div class="modal modal-open">
            <div class="modal-box max-w-2xl">
              <h3 class="text-lg font-bold">编辑世界观设定</h3>
              <div class="py-4 space-y-3">
                <div>
                  <label class="label">
                    <span class="label-text">分类</span>
                  </label>
                  <input
                    type="text"
                    value={setting().category}
                    onInput={(e) => setEditingWorld({ ...setting(), category: e.currentTarget.value })}
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
                    onInput={(e) => setEditingWorld({ ...setting(), title: e.currentTarget.value })}
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
                    onInput={(e) => setEditingWorld({ ...setting(), description: e.currentTarget.value })}
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
                <button onClick={() => saveWorldSetting(setting())} class="btn btn-primary">
                  保存
                </button>
              </div>
            </div>
            <div class="modal-backdrop" onClick={() => setEditingWorld(null)}></div>
          </div>
        )}
      </Show>

      {/* 灵感笔记编辑模态框 */}
      <Show when={editingNote()}>
        {(note) => (
          <div class="modal modal-open">
            <div class="modal-box max-w-2xl">
              <h3 class="text-lg font-bold">编辑灵感笔记</h3>
              <div class="py-4 space-y-3">
                <div>
                  <label class="label">
                    <span class="label-text">标题</span>
                  </label>
                  <input
                    type="text"
                    value={note().title}
                    onInput={(e) => setEditingNote({ ...note(), title: e.currentTarget.value })}
                    class="input input-bordered w-full"
                    placeholder="笔记标题"
                  />
                </div>
                <div>
                  <label class="label">
                    <span class="label-text">内容</span>
                  </label>
                  <textarea
                    value={note().content}
                    onInput={(e) => setEditingNote({ ...note(), content: e.currentTarget.value })}
                    class="textarea textarea-bordered w-full"
                    rows="10"
                    placeholder="记录你的灵感..."
                  />
                </div>
              </div>
              <div class="modal-action">
                <button onClick={() => setEditingNote(null)} class="btn btn-ghost">
                  取消
                </button>
                <button
                  onClick={() =>
                    saveNote({
                      ...note(),
                      timestamp: new Date().toLocaleString('zh-CN'),
                    })
                  }
                  class="btn btn-primary"
                >
                  保存
                </button>
              </div>
            </div>
            <div class="modal-backdrop" onClick={() => setEditingNote(null)}></div>
          </div>
        )}
      </Show>
    </div>
  );
}
