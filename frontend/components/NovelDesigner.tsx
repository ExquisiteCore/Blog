'use client';

import { useState, useRef, useSyncExternalStore } from 'react';

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
  bodyContent: string;
}

type ViewMode = 'home' | 'detail';
type ModalType = 'background' | 'characters' | 'relationships' | 'worldview' | 'timeline' | 'outline' | 'writing' | null;
type RelationshipViewMode = 'list' | 'graph';

const STORAGE_KEY = 'novel-designer-novels';

// 缓存 novels 数据，避免每次返回新数组
let cachedNovels: Novel[] = [];
let cachedNovelsJson = '';

// localStorage 存储函数
function getStoredNovels(): Novel[] {
  if (typeof window === 'undefined') return cachedNovels;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // 只有当数据真正变化时才更新缓存
      if (stored !== cachedNovelsJson) {
        cachedNovelsJson = stored;
        cachedNovels = JSON.parse(stored) || [];
      }
      return cachedNovels;
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  if (cachedNovels.length > 0) {
    cachedNovels = [];
    cachedNovelsJson = '';
  }
  return cachedNovels;
}

const serverSnapshot: Novel[] = [];
function getServerSnapshot(): Novel[] {
  return serverSnapshot;
}

function subscribeToStorage(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export default function NovelDesigner() {
  // ID 生成计数器
  const idCounterRef = useRef(0);
  const generateId = () => {
    const timestamp = Date.now();
    idCounterRef.current = (idCounterRef.current + 1) % 1000;
    return `${timestamp}-${idCounterRef.current}`;
  };

  // 使用 useSyncExternalStore 从 localStorage 读取数据
  const storedNovels = useSyncExternalStore(
    subscribeToStorage,
    getStoredNovels,
    getServerSnapshot
  );

  // 状态
  const [novels, setNovels] = useState<Novel[]>(storedNovels);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [relationshipViewMode, setRelationshipViewMode] = useState<RelationshipViewMode>('list');

  // 编辑状态
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [editingWorld, setEditingWorld] = useState<WorldSetting | null>(null);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [editingTimeline, setEditingTimeline] = useState<TimelineEvent | null>(null);
  const [editingOutline, setEditingOutline] = useState<OutlineItem | null>(null);
  const [editingNovel, setEditingNovel] = useState<Partial<Novel> | null>(null);

  // 正文编辑状态
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [chapterContent, setChapterContent] = useState<string>('');

  // 保存到 localStorage
  const saveToStorage = (novelsData: Novel[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novelsData));
    } catch (e) {
      console.error('Failed to save data:', e);
      alert('保存失败,可能是存储空间不足');
    }
  };

  // 筛选小说
  const filteredNovels = () => {
    const query = searchQuery.toLowerCase();
    if (!query) return novels;
    return novels.filter((novel) => novel.title.toLowerCase().includes(query));
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
    const novel = editingNovel;
    if (!novel) return;

    const existing = novels.find((n) => n.id === novel.id);
    let newNovels: Novel[];
    let newSelectedNovel: Novel;

    if (existing) {
      newSelectedNovel = { ...existing, ...novel } as Novel;
      newNovels = novels.map((n) => (n.id === novel.id ? newSelectedNovel : n));
    } else {
      newSelectedNovel = novel as Novel;
      newNovels = [...novels, newSelectedNovel];
    }

    setNovels(newNovels);
    setSelectedNovel(newSelectedNovel);
    setEditingNovel(null);
    setViewMode('detail');
    saveToStorage(newNovels);
  };

  // 删除小说
  const deleteNovel = (id: string) => {
    if (confirm('确定要删除这部小说吗？所有相关数据都将被删除。')) {
      const newNovels = novels.filter((n) => n.id !== id);
      setNovels(newNovels);
      if (selectedNovel?.id === id) {
        setSelectedNovel(null);
        setViewMode('home');
      }
      saveToStorage(newNovels);
    }
  };

  // 更新选中的小说
  const updateSelectedNovel = (updater: (novel: Novel) => Novel) => {
    const current = selectedNovel;
    if (!current) return;
    const updated = updater(current);
    setSelectedNovel(updated);
    const newNovels = novels.map((n) => (n.id === updated.id ? updated : n));
    setNovels(newNovels);
    saveToStorage(newNovels);
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
    const char = editingCharacter;
    if (!char) return;

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
    const novel = selectedNovel;
    if (!novel) return;

    const charToDelete = novel.characters.find((c) => c.id === id);
    if (!charToDelete) return;

    if (confirm('确定要删除这个角色吗？相关的人物关系也将被删除。')) {
      updateSelectedNovel((novel) => ({
        ...novel,
        characters: novel.characters.filter((c) => c.id !== id),
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
    const setting = editingWorld;
    if (!setting) return;

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
    const rel = editingRelationship;
    if (!rel) return;

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
    const event = editingTimeline;
    if (!event) return;

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
      bodyContent: '',
    });
  };

  const saveOutline = () => {
    const outline = editingOutline;
    if (!outline) return;

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

  // ===== 正文编辑 =====
  const openWritingEditor = (chapterId?: string) => {
    const novel = selectedNovel;
    if (!novel) return;

    if (novel.outlines.length === 0) {
      alert('请先在"章节梗概"中创建章节');
      return;
    }

    const targetChapterId = chapterId || novel.outlines[0].id;
    const chapter = novel.outlines.find((o) => o.id === targetChapterId);

    if (chapter) {
      setSelectedChapterId(targetChapterId);
      setChapterContent(chapter.bodyContent || '');
      setActiveModal('writing');
    }
  };

  const switchChapter = (chapterId: string) => {
    saveChapterContent();

    const chapter = selectedNovel?.outlines.find((o) => o.id === chapterId);
    if (chapter) {
      setSelectedChapterId(chapterId);
      setChapterContent(chapter.bodyContent || '');
    }
  };

  const saveChapterContent = () => {
    const chapterId = selectedChapterId;
    const content = chapterContent;

    if (!chapterId) return;

    updateSelectedNovel((novel) => ({
      ...novel,
      outlines: novel.outlines.map((o) =>
        o.id === chapterId ? { ...o, bodyContent: content } : o
      ),
    }));
  };

  const getWordCount = (text: string) => {
    return text.replace(/\s/g, '').length;
  };

  // ===== 导出/导入 =====
  const exportData = () => {
    const data = novels;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novels-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateNovelData = (data: unknown): data is Novel[] => {
    if (!Array.isArray(data)) return false;

    return data.every((novel: unknown) => {
      if (typeof novel !== 'object' || novel === null) return false;
      const n = novel as Record<string, unknown>;
      return (
        typeof n.id === 'string' &&
        typeof n.title === 'string' &&
        typeof n.createdAt === 'string' &&
        Array.isArray(n.characters) &&
        Array.isArray(n.worldSettings) &&
        Array.isArray(n.relationships) &&
        Array.isArray(n.timeline) &&
        Array.isArray(n.outlines)
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

            if (!validateNovelData(data)) {
              alert('导入失败,文件格式不正确。请确保导入的是有效的小说数据文件。');
              return;
            }

            if (confirm('导入将覆盖当前所有数据，确定继续吗？')) {
              setNovels(data);
              saveToStorage(data);
              alert('导入成功！');
            }
          } catch {
            alert('导入失败，文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* 左侧侧边栏 */}
      <div className="w-64 flex-shrink-0 space-y-4">
        {/* 创建小说按钮 */}
        <button
          onClick={createNovel}
          className="btn btn-primary btn-block gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          创建小说
        </button>

        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索小说..."
            className="input input-bordered w-full pr-10"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* 书籍列表 */}
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
          {filteredNovels().map((novel) => (
            <div
              key={novel.id}
              className={`cursor-pointer rounded-lg border p-3 transition-all hover:bg-base-200 ${
                selectedNovel?.id === novel.id ? 'border-primary bg-base-200' : 'border-base-300'
              }`}
              onClick={() => {
                if (selectedNovel?.id !== novel.id) {
                  setSelectedNovel(novel);
                  setViewMode('home');
                }
              }}
            >
              <div className="mb-1 flex items-start justify-between">
                <h3 className="font-semibold line-clamp-1">{novel.title}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNovel(novel.id);
                  }}
                  className="btn btn-ghost btn-xs text-error"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-xs opacity-60">{novel.createdAt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 主体内容 */}
      <div className="relative flex-1 overflow-hidden rounded-lg border border-base-300 bg-base-100">
        {!selectedNovel && (
          <div className="flex h-full items-center justify-center text-base-content/60">
            <div className="text-center">
              <p className="mb-4 text-lg">选择一部小说开始创作</p>
              <p className="text-sm">或点击左侧的&quot;创建小说&quot;按钮新建小说</p>
            </div>
          </div>
        )}

        {selectedNovel && viewMode === 'home' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{selectedNovel.title}</h2>
              <div className="flex gap-2">
                <button onClick={exportData} className="btn btn-outline btn-sm">
                  导出
                </button>
                <button onClick={importData} className="btn btn-outline btn-sm">
                  导入
                </button>
                <button
                  onClick={() => setViewMode('detail')}
                  className="btn btn-primary btn-sm"
                >
                  详情
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* 角色列表 */}
              <div>
                <h3 className="mb-3 text-lg font-semibold">角色名单</h3>
                <div className="space-y-2">
                  {(selectedNovel.characters || []).map((char) => (
                    <div key={char.id} className="rounded-lg border border-base-300 bg-base-100 p-3">
                      <div className="font-semibold">{char.name || '未命名角色'}</div>
                      <div className="text-sm opacity-70">
                        {char.age} · {char.gender}
                      </div>
                    </div>
                  ))}
                  {(selectedNovel.characters.length || 0) === 0 && (
                    <div className="py-8 text-center text-sm text-base-content/60">
                      还没有添加角色
                    </div>
                  )}
                </div>
              </div>

              {/* 世界观 */}
              <div>
                <h3 className="mb-3 text-lg font-semibold">世界观</h3>
                <div className="space-y-2">
                  {(selectedNovel.worldSettings || []).map((setting) => (
                    <div key={setting.id} className="rounded-lg border border-base-300 bg-base-100 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="badge badge-secondary badge-sm">
                          {setting.category}
                        </span>
                        <span className="font-semibold">{setting.title}</span>
                      </div>
                      <p className="line-clamp-2 text-sm opacity-70">
                        {setting.description}
                      </p>
                    </div>
                  ))}
                  {(selectedNovel.worldSettings.length || 0) === 0 && (
                    <div className="py-8 text-center text-sm text-base-content/60">
                      还没有添加世界观设定
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedNovel && viewMode === 'detail' && (
          <div className="flex h-full">
            {/* 详情页左侧侧边栏 */}
            <div className="w-64 flex-shrink-0 border-r border-base-300 bg-base-200 p-4">
              <div className="space-y-4">
                {/* 封面 */}
                <div className="aspect-[3/4] overflow-hidden rounded-lg border-2 border-base-300 bg-base-300">
                  {selectedNovel.cover ? (
                    <img
                      src={selectedNovel.cover}
                      alt="封面"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-base-content/40">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 书名 */}
                <div className="text-center">
                  <h2 className="text-xl font-bold">{selectedNovel.title}</h2>
                </div>

                {/* 简介 */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold opacity-70">简介</h3>
                  <p className="text-sm leading-relaxed">
                    {selectedNovel.summary || '暂无简介'}
                  </p>
                </div>

                {/* 编辑按钮 */}
                <button
                  onClick={() => setEditingNovel(selectedNovel)}
                  className="btn btn-outline btn-block btn-sm"
                >
                  编辑基本信息
                </button>

                {/* 返回按钮 */}
                <button
                  onClick={() => setViewMode('home')}
                  className="btn btn-ghost btn-block btn-sm"
                >
                  返回首页
                </button>
              </div>
            </div>

            {/* 详情页主体 - 7个功能按钮 */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <button
                  onClick={() => setActiveModal('background')}
                  className="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-orange-500/10 to-orange-600/10 p-6 transition-all hover:scale-105 hover:border-orange-500 hover:shadow-lg"
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="mb-3 text-4xl">📖</div>
                    <h3 className="text-xl font-bold group-hover:text-orange-600">背景</h3>
                  </div>
                </button>

                <button
                  onClick={() => setActiveModal('characters')}
                  className="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-6 transition-all hover:scale-105 hover:border-blue-500 hover:shadow-lg"
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="mb-3 text-4xl">👥</div>
                    <h3 className="text-xl font-bold group-hover:text-blue-600">人物详情</h3>
                  </div>
                </button>

                <button
                  onClick={() => setActiveModal('relationships')}
                  className="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-6 transition-all hover:scale-105 hover:border-purple-500 hover:shadow-lg"
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="mb-3 text-4xl">🔗</div>
                    <h3 className="text-xl font-bold group-hover:text-purple-600">
                      人物关系网
                    </h3>
                  </div>
                </button>

                <button
                  onClick={() => setActiveModal('worldview')}
                  className="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-green-500/10 to-green-600/10 p-6 transition-all hover:scale-105 hover:border-green-500 hover:shadow-lg"
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="mb-3 text-4xl">🌍</div>
                    <h3 className="text-xl font-bold group-hover:text-green-600">世界设定</h3>
                  </div>
                </button>

                <button
                  onClick={() => setActiveModal('timeline')}
                  className="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-pink-500/10 to-pink-600/10 p-6 transition-all hover:scale-105 hover:border-pink-500 hover:shadow-lg"
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="mb-3 text-4xl">⏰</div>
                    <h3 className="text-xl font-bold group-hover:text-pink-600">时间线</h3>
                  </div>
                </button>

                <button
                  onClick={() => setActiveModal('outline')}
                  className="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 p-6 transition-all hover:scale-105 hover:border-yellow-500 hover:shadow-lg"
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="mb-3 text-4xl">📝</div>
                    <h3 className="text-xl font-bold group-hover:text-yellow-600">
                      章节梗概
                    </h3>
                  </div>
                </button>

                <button
                  onClick={() => openWritingEditor()}
                  className="group aspect-[4/3] rounded-xl border-2 border-base-300 bg-gradient-to-br from-red-500/10 to-red-600/10 p-6 transition-all hover:scale-105 hover:border-red-500 hover:shadow-lg"
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="mb-3 text-4xl">✍️</div>
                    <h3 className="text-xl font-bold group-hover:text-red-600">
                      正文编辑
                    </h3>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== 模态框们 ===== */}

      {/* 小说基本信息编辑模态框 */}
      {editingNovel && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="mb-4 text-lg font-bold">编辑小说信息</h3>
            <div className="space-y-3">
              <div>
                <label className="label">
                  <span className="label-text">书名</span>
                </label>
                <input
                  type="text"
                  value={editingNovel.title || ''}
                  onChange={(e) =>
                    setEditingNovel({ ...editingNovel, title: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="输入书名"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">封面图片URL</span>
                </label>
                <input
                  type="text"
                  value={editingNovel.cover || ''}
                  onChange={(e) =>
                    setEditingNovel({ ...editingNovel, cover: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="输入封面图片URL"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">简介</span>
                </label>
                <textarea
                  value={editingNovel.summary || ''}
                  onChange={(e) =>
                    setEditingNovel({ ...editingNovel, summary: e.target.value })
                  }
                  className="textarea textarea-bordered w-full"
                  rows={4}
                  placeholder="输入简介"
                />
              </div>
            </div>
            <div className="modal-action">
              <button onClick={() => setEditingNovel(null)} className="btn btn-ghost">
                取消
              </button>
              <button onClick={saveNovelInfo} className="btn btn-primary">
                保存
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setEditingNovel(null)}></div>
        </div>
      )}

      {/* 背景模态框 */}
      {activeModal === 'background' && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="mb-4 text-lg font-bold">故事背景</h3>
            <textarea
              value={selectedNovel?.background || ''}
              onChange={(e) =>
                updateSelectedNovel((novel) => ({
                  ...novel,
                  background: e.target.value,
                }))
              }
              className="textarea textarea-bordered w-full"
              rows={15}
              placeholder="描述故事的整体背景、时代背景、地点等..."
            />
            <div className="modal-action">
              <button onClick={() => setActiveModal(null)} className="btn btn-primary">
                完成
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setActiveModal(null)}></div>
        </div>
      )}

      {/* 人物详情模态框 */}
      {activeModal === 'characters' && (
        <div className="modal modal-open">
          <div className="modal-box max-w-6xl h-[80vh]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">人物详情</h3>
              <button onClick={addCharacter} className="btn btn-primary btn-sm">
                + 添加角色
              </button>
            </div>
            <div className="h-[calc(100%-8rem)] overflow-y-auto">
              <div className="grid gap-4 md:grid-cols-2">
                {(selectedNovel?.characters || []).map((char) => (
                  <div key={char.id} className="card border border-base-300 bg-base-100 shadow-sm">
                    <div className="card-body p-4">
                      <h3 className="card-title text-lg">{char.name || '未命名角色'}</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-semibold">年龄:</span> {char.age || '-'}
                        </p>
                        <p>
                          <span className="font-semibold">性别:</span> {char.gender || '-'}
                        </p>
                        <p>
                          <span className="font-semibold">性格:</span>{' '}
                          {char.personality || '-'}
                        </p>
                        <p className="line-clamp-2">
                          <span className="font-semibold">详细描述:</span>{' '}
                          {char.description || '-'}
                        </p>
                      </div>
                      <div className="card-actions mt-3 justify-end">
                        <button
                          onClick={() => setEditingCharacter(char)}
                          className="btn btn-ghost btn-xs"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => deleteCharacter(char.id)}
                          className="btn btn-error btn-ghost btn-xs"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {(selectedNovel?.characters.length || 0) === 0 && (
                <div className="py-16 text-center text-base-content/60">
                  还没有添加角色，点击右上角按钮开始创建吧！
                </div>
              )}
            </div>
            <div className="modal-action">
              <button onClick={() => setActiveModal(null)} className="btn">
                关闭
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setActiveModal(null)}></div>
        </div>
      )}

      {/* 角色编辑模态框 */}
      {editingCharacter && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="mb-4 text-lg font-bold">编辑角色</h3>
            <div className="space-y-3">
              <div>
                <label className="label">
                  <span className="label-text">姓名</span>
                </label>
                <input
                  type="text"
                  value={editingCharacter.name}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, name: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="角色姓名"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    <span className="label-text">年龄</span>
                  </label>
                  <input
                    type="text"
                    value={editingCharacter.age}
                    onChange={(e) =>
                      setEditingCharacter({ ...editingCharacter, age: e.target.value })
                    }
                    className="input input-bordered w-full"
                    placeholder="年龄"
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">性别</span>
                  </label>
                  <input
                    type="text"
                    value={editingCharacter.gender}
                    onChange={(e) =>
                      setEditingCharacter({ ...editingCharacter, gender: e.target.value })
                    }
                    className="input input-bordered w-full"
                    placeholder="性别"
                  />
                </div>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">性格</span>
                </label>
                <input
                  type="text"
                  value={editingCharacter.personality}
                  onChange={(e) =>
                    setEditingCharacter({
                      ...editingCharacter,
                      personality: e.target.value,
                    })
                  }
                  className="input input-bordered w-full"
                  placeholder="性格特点"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">背景故事</span>
                </label>
                <textarea
                  value={editingCharacter.background}
                  onChange={(e) =>
                    setEditingCharacter({
                      ...editingCharacter,
                      background: e.target.value,
                    })
                  }
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  placeholder="角色背景故事"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">详细描述</span>
                </label>
                <textarea
                  value={editingCharacter.description}
                  onChange={(e) =>
                    setEditingCharacter({
                      ...editingCharacter,
                      description: e.target.value,
                    })
                  }
                  className="textarea textarea-bordered w-full"
                  rows={4}
                  placeholder="角色的详细描述"
                />
              </div>
            </div>
            <div className="modal-action">
              <button onClick={() => setEditingCharacter(null)} className="btn btn-ghost">
                取消
              </button>
              <button onClick={saveCharacter} className="btn btn-primary">
                保存
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setEditingCharacter(null)}></div>
        </div>
      )}

      {/* 更多模态框将在需要时添加... */}
      {/* 为简化代码，其他模态框（人物关系、世界设定、时间线、章节梗概、正文编辑）的实现方式类似 */}

    </div>
  );
}
