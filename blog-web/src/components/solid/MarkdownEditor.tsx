export const prerender = false;

import { createSignal, onMount, Show } from 'solid-js';
import MarkdownRenderer from './MarkdownRenderer';
import { Image, Edit, Eye, Download, Settings } from 'lucide-solid';
import { pinyin } from 'pinyin-pro';
import http from '@/lib/axios';

export default function MarkdownEditor() {
  // 编辑器内容
  const [text, setText] = createSignal('EC is too lazy to write a refresh button, because he thinks \'refresh\' = \'edit\' + \'preview\'. Actually, that makes sense :D');
  // 编辑器模式：edit - 编辑模式，preview - 预览模式
  const [mode, setMode] = createSignal<'edit' | 'preview'>('edit');
  // 封面图片URL
  const [coverImage, setCoverImage] = createSignal<string>('');
  // 文章标签
  const [tags, setTags] = createSignal<string[]>([]);
  // 标签输入
  const [tagInput, setTagInput] = createSignal<string>('');
  // 所有可用标签列表
  const [availableLabels, setAvailableLabels] = createSignal<any[]>([]);
  // 选中的标签ID列表
  const [selectedLabelIds, setSelectedLabelIds] = createSignal<string[]>([]);
  // 文章标题
  const [title, setTitle] = createSignal<string>('');
  // 文章摘要
  const [summary, setSummary] = createSignal<string>('');
  // 文章slug
  const [slug, setSlug] = createSignal<string>('');
  // 发布状态
  const [isPublishing, setIsPublishing] = createSignal<boolean>(false);
  // 是否已挂载标志
  const [isMounted, setIsMounted] = createSignal(false);

  // 获取所有标签
  const fetchLabels = async () => {
    try {
      // 这里应该替换为实际的API调用
      const { data } = await http.get('/labels');
      if (Array.isArray(data)) {
        setAvailableLabels(data);
      } else {
        throw new Error('标签数据格式错误');
      }
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };

  // 设置已挂载标志
  onMount(() => {
    setIsMounted(true);
    fetchLabels();
  });

  // 处理导出文档
  const handleExport = () => {
    const blob = new Blob([text()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title() || 'markdown'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 处理设置
  const handleSettings = () => {
    alert('设置功能将在后续实现');
  };

  // 处理标题和slug的逻辑
  const generateSlug = (text: string) => {
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);

    let convertedText = text;
    if (hasChinese) {
      convertedText = pinyin(text, {
        toneType: "none",
        pattern: "pinyin",
        type: "string",
        nonZh: "consecutive",
      }).replace(/\s+/g, "-");
    }

    return convertedText
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // 处理标题变化时自动生成slug
  const handleTitleChange = (e: Event) => {
    const newTitle = (e.target as HTMLInputElement).value;
    setTitle(newTitle);

    //如果slug为空或者等于当前title生成的slug，就更新slug
    if (!slug() || slug() === generateSlug(title())) {
      setSlug(generateSlug(newTitle));
    }
  };

  // 创建新标签
  const createLabel = async (name: string): Promise<any | null> => {
    try {
      const slug = generateSlug(name);
      const labelData = {
        name,
        slug,
        description: `${name}相关文章`
      };

      // 这里应该替换为实际的API调用
      const { data } = await http.post('/labels', labelData);

      if (data && typeof data === 'object' && 'id' in data) {
        const newLabel = data;
        setAvailableLabels([...availableLabels(), newLabel]);
        return newLabel;
      } else {
        throw new Error('创建标签失败，返回数据格式错误');
      }
    } catch (error) {
      console.error('创建标签失败:', error);
      // 这里应该替换为实际的toast通知
      alert('创建标签失败，请重试');
      return null;
    }
  };

  // 处理标签输入
  const handleTagInput = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const input = target.value;
    setTagInput(input);

    // 如果输入以逗号结尾，表示用户想添加一个标签
    if (input.endsWith(',')) {
      const tagName = input.slice(0, -1).trim();
      if (tagName) {
        await addTag(tagName);
        setTagInput('');
      }
    }
  };

  // 添加标签
  const addTag = async (tagName: string) => {
    // 检查标签是否已存在于已选择的标签中
    if (tags().includes(tagName)) {
      // 这里应该替换为实际的toast通知
      alert(`标签 "${tagName}" 已添加`);
      return;
    }

    // 检查标签是否存在于可用标签列表中
    let labelId: string | null = null;
    const existingLabel = availableLabels().find(label => label.name === tagName);

    if (existingLabel) {
      // 如果标签已存在，使用现有标签ID
      labelId = existingLabel.id;
    } else {
      // 如果标签不存在，创建新标签
      const newLabel = await createLabel(tagName);
      if (newLabel) {
        labelId = newLabel.id;
      }
    }

    if (labelId) {
      // 更新已选择的标签ID和标签名称
      setSelectedLabelIds([...selectedLabelIds(), labelId]);
      setTags([...tags(), tagName]);
    }
  };

  // 处理标签删除
  const removeTag = (index: number) => {
    const newTags = [...tags()];
    const newLabelIds = [...selectedLabelIds()];
    newTags.splice(index, 1);
    newLabelIds.splice(index, 1);
    setTags(newTags);
    setSelectedLabelIds(newLabelIds);
  };

  // 处理发布文章
  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      // 验证必填字段
      if (!title()) {
        alert('请输入文章标题');
        return;
      }

      if (!text() || text().trim().length < 10) {
        alert('文章内容太短');
        return;
      }

      if (!slug()) {
        alert('请输入文章别名');
        return;
      }

      if (!coverImage()) {
        alert('请设置封面图片');
        return;
      }

      // 从localStorage获取用户信息
      const userData = localStorage.getItem('user');
      if (!userData) {
        alert('请先登录');
        return;
      }

      const user = JSON.parse(userData);
      const authorId = user.id;

      // 构建请求体
      const postData = {
        title: title(),
        content: text(),
        slug: slug(),
        summary: summary() || title(), // 如果没有摘要，使用标题
        featured_image: coverImage(),
        author_id: authorId,
        published: true,
        labels: selectedLabelIds().length > 0 ? selectedLabelIds() : [] // 标签ID数组
      };

      // 发送请求
      await http.post('/posts', postData, { withToken: true });

      alert('文章发布成功！');

      // 清空表单
      setTitle('');
      setText('');
      setSlug('');
      setSummary('');
      setCoverImage('');
      setTags([]);
      setSelectedLabelIds([]);
    } catch (error) {
      console.error('发布文章失败:', error);
      alert(error instanceof Error ? error.message : '发布失败，请重试');
    } finally {
      setIsPublishing(false);
    }
  };

  // 处理标签键盘事件
  const handleTagKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput().trim()) {
        addTag(tagInput().trim());
        setTagInput('');
      }
    }
  };

  return (
    <div class="min-h-screen">
      <div class="container mx-auto flex min-h-screen flex-col py-8 px-4">
        {/* 顶部工具栏 */}
        <div class="mb-6 flex items-center justify-between">
          <div class="flex space-x-2">
            <button
              class={`btn ${mode() === 'preview' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setMode('preview')}
            >
              <Eye class="h-4 w-4" />
              <span>预览</span>
            </button>
            <button
              class={`btn ${mode() === 'edit' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setMode('edit')}
            >
              <Edit class="h-4 w-4" />
              <span>编辑</span>
            </button>
          </div>
          <div class="flex space-x-2">
            <button class="btn btn-outline btn-sm" onClick={handleExport}>
              <Download class="h-4 w-4" />
              <span>导出</span>
            </button>
            <button class="btn btn-outline btn-sm" onClick={handleSettings}>
              <Settings class="h-4 w-4" />
              <span>设置</span>
            </button>
          </div>
        </div>

        {/* 编辑器区域 */}
        <div class="flex-1">
          <Show when={isMounted()}>
            <Show when={mode() === 'edit'}>
              <textarea
                value={text()}
                onInput={(e) => setText(e.target.value)}
                class="h-[calc(100vh-300px)] w-full p-4 focus:outline-none border border-base-200 rounded-md"
              />
            </Show>
            <Show when={mode() === 'preview'}>
              <div class="h-[calc(100vh-300px)] overflow-auto border border-base-200 rounded-md p-4">
                <MarkdownRenderer content={text()} />
              </div>
            </Show>
          </Show>
        </div>

        {/* 底部区域 - 封面图片和标签 */}
        <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 封面图片上传 */}
          <div class="flex flex-col space-y-2">
            <span class="text-sm font-medium">封面图片：</span>
            <div class="flex gap-4">
              <div class="flex-1 space-y-2">
                <div class="flex w-full items-center space-x-2">
                  <input
                    type="text"
                    placeholder="封面链接"
                    class="input input-bordered w-full"
                    value={coverImage()}
                    onInput={(e) => setCoverImage(e.target.value)}
                  />
                </div>
                <div>
                  <p class="text-xs text-gray-500">随机图片调用于www.dmoe.cc的接口，不代表我的个人审美</p>
                  <button
                    class="btn btn-sm mt-2 btn-primary"
                    onClick={() => setCoverImage(`https://www.dmoe.cc/random.php?t=${Date.now()}`)}
                  >
                    <div class="flex items-center">
                      <span class="mr-1">随机图片</span>
                    </div>
                  </button>
                </div>
              </div>
              <div class="w-[200px] h-[150px] overflow-hidden rounded-md border border-gray-200 bg-white dark:bg-gray-800">
                <Show when={coverImage()} fallback={
                  <div class="flex h-full w-full flex-col items-center justify-center text-gray-500">
                    <Image class="mb-2 h-8 w-8" />
                    <p class="text-xs">预览区域</p>
                  </div>
                }>
                  <img
                    src={coverImage()}
                    alt="封面图片"
                    class="h-full w-full object-cover"
                  />
                </Show>
              </div>
            </div>
          </div>

          {/* 文章标签和标题 */}
          <div class="space-y-4">
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium">文章标签：</span>
                <input
                  type="text"
                  placeholder="输入标签，按逗号添加"
                  class="input input-bordered w-full"
                  value={tagInput()}
                  onInput={handleTagInput}
                  onKeyDown={handleTagKeyDown}
                />
              </div>
              <Show when={tags().length > 0}>
                <div class="flex flex-wrap gap-2 mt-2">
                  {tags().map((tag, index) => (
                    <div class="badge badge-primary gap-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        class="text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                        onClick={() => removeTag(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </Show>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">文章标题：</span>
              <input
                type="text"
                placeholder="输入文章标题"
                class="input input-bordered w-full"
                value={title()}
                onInput={handleTitleChange}
              />
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">文章别名：</span>
              <input
                type="text"
                placeholder="输入文章别名，用于URL"
                class="input input-bordered w-full"
                value={slug()}
                onInput={(e) => setSlug(e.target.value)}
              />
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">文章摘要：</span>
              <input
                type="text"
                placeholder="输入文章摘要（可选）"
                class="input input-bordered w-full"
                value={summary()}
                onInput={(e) => setSummary(e.target.value)}
              />
            </div>
            <div class="flex justify-end">
              <button
                class="btn btn-primary mt-2"
                onClick={handlePublish}
                disabled={isPublishing()}
              >
                {isPublishing() ? '发布中...' : '发布'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}