export const prerender = false;

import { createSignal, onMount, Show } from 'solid-js';
import MarkdownRenderer from './MarkdownRenderer';
import { Image, Edit, Eye, Download, Settings, Upload } from 'lucide-solid';
import { pinyin } from 'pinyin-pro';
import http from '@/lib/axios';

export default function MarkdownEditor() {
  // 编辑器内容
  const [text, setText] = createSignal(
    "EC is too lazy to write a refresh button, because he thinks 'refresh' = 'edit' + 'preview'. Actually, that makes sense :D"
  );
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
  // 图片上传状态
  const [isUploading, setIsUploading] = createSignal<boolean>(false);
  // 上传token
  const [uploadToken, setUploadToken] = createSignal<string>('');
  // 自定义上传 API 地址
  const [uploadApiUrl, setUploadApiUrl] = createSignal<string>(
    'http://121.62.28.11:40027/api/v1'
  );
  // 设置弹窗显示状态
  const [showSettingsModal, setShowSettingsModal] =
    createSignal<boolean>(false);
  // 编辑器引用
  let editorRef: HTMLTextAreaElement | undefined;
  // 封面图片上传区域引用
  let coverDropzoneRef: HTMLDivElement | undefined;
  let apiUrlInputRef: HTMLInputElement | undefined; // 新增 API URL 输入框的引用

  // 获取所有标签
  const fetchLabels = async () => {
    try {
      // 这里应该替换为实际的API调用
      const data = await http.get('/labels');
      if (Array.isArray(data)) {
        setAvailableLabels(data);
      } else {
        throw new Error('标签数据格式错误');
      }
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };

  // 处理图片上传
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请上传图片文件');
        return null;
      }

      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);

      // 发送上传请求
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
      };
      if (uploadToken()) {
        headers['Authorization'] = `Bearer ${uploadToken()}`;
      }
      const baseUrl = uploadApiUrl() || 'http://121.62.28.11:40027/api/v1';
      const response = await http.post('/upload', formData, {
        baseURL: baseUrl,
        headers: headers,
      });

      if (response && response.status && response.data) {
        // 返回markdown格式的图片链接
        return response.data.links.markdown;
      } else {
        throw new Error('上传失败，返回数据格式错误');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      alert(error instanceof Error ? error.message : '上传失败，请重试');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // 处理编辑器中的图片粘贴
  const handleEditorPaste = async (e: ClipboardEvent) => {
    if (!e.clipboardData) return;

    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const markdownLink = await uploadImage(file);
          if (markdownLink) {
            // 获取当前光标位置
            const textarea = e.target as HTMLTextAreaElement;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentText = text();

            // 在光标位置插入markdown图片链接
            const newText =
              currentText.substring(0, start) +
              markdownLink +
              currentText.substring(end);
            setText(newText);

            // 设置新的光标位置
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd =
                start + markdownLink.length;
              textarea.focus();
            }, 0);
          }
        }
        break;
      }
    }
  };

  // 处理编辑器中的拖拽上传
  const handleEditorDrop = async (e: DragEvent) => {
    e.preventDefault();

    if (!e.dataTransfer) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const markdownLink = await uploadImage(file);
        if (markdownLink) {
          // 获取拖拽位置的光标位置
          const textarea = e.target as HTMLTextAreaElement;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const currentText = text();

          // 在光标位置插入markdown图片链接
          const newText =
            currentText.substring(0, start) +
            markdownLink +
            currentText.substring(end);
          setText(newText);

          // 设置新的光标位置
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd =
              start + markdownLink.length;
            textarea.focus();
          }, 0);
        }
      }
    }
  };

  // 处理编辑器拖拽进入事件
  const handleEditorDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  // 处理封面图片上传
  const handleCoverImageUpload = async (file: File) => {
    try {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请上传图片文件');
        return;
      }

      setIsUploading(true);

      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);

      // 发送上传请求
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
      };
      if (uploadToken()) {
        headers['Authorization'] = `Bearer ${uploadToken()}`;
      }
      const baseUrl = uploadApiUrl() || 'http://121.62.28.11:40027/api/v1';
      const response = await http.post('/upload', formData, {
        baseURL: baseUrl,
        headers: headers,
      });

      if (response && response.status && response.data) {
        // 设置封面图片URL
        setCoverImage(response.data.links.url);
      } else {
        throw new Error('上传失败，返回数据格式错误');
      }
    } catch (error) {
      console.error('上传封面图片失败:', error);
      alert(error instanceof Error ? error.message : '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 处理封面图片区域的拖拽上传
  const handleCoverDrop = async (e: DragEvent) => {
    e.preventDefault();

    if (!e.dataTransfer) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      await handleCoverImageUpload(file);
    }
  };

  // 处理封面图片区域的拖拽进入事件
  const handleCoverDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  // 处理封面图片文件选择
  const handleCoverFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleCoverImageUpload(input.files[0]);
    }
  };

  // 设置已挂载标志
  onMount(() => {
    const savedToken = localStorage.getItem('uploadToken');
    if (savedToken) {
      setUploadToken(savedToken);
    }
    const savedApiUrl = localStorage.getItem('uploadApiUrl');
    if (savedApiUrl) {
      setUploadApiUrl(savedApiUrl);
    }
    setIsMounted(true);
    fetchLabels();

    // 添加全局粘贴事件监听
    document.addEventListener('paste', (e) => {
      // 只有在编辑模式下才处理粘贴事件
      if (mode() === 'edit' && document.activeElement === editorRef) {
        handleEditorPaste(e);
      }
    });
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
    setShowSettingsModal(true);
  };

  // 关闭设置弹窗
  const handleCloseSettingsModal = () => {
    setShowSettingsModal(false);
  };

  // 保存设置
  const handleSaveSettings = (newToken: string, newApiUrl: string) => {
    setUploadToken(newToken);
    localStorage.setItem('uploadToken', newToken);
    setUploadApiUrl(newApiUrl);
    localStorage.setItem('uploadApiUrl', newApiUrl);
    setShowSettingsModal(false);
  };

  // 处理标题和slug的逻辑
  const generateSlug = (text: string) => {
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);

    let convertedText = text;
    if (hasChinese) {
      convertedText = pinyin(text, {
        toneType: 'none',
        pattern: 'pinyin',
        type: 'string',
        nonZh: 'consecutive',
      }).replace(/\s+/g, '-');
    }

    return convertedText
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
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
        description: `${name}相关文章`,
      };

      // 这里应该替换为实际的API调用
      const data = await http.post('/labels', labelData, {
        withToken: true,
      });

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
    const existingLabel = availableLabels().find(
      (label) => label.name === tagName
    );

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
        labels: selectedLabelIds().length > 0 ? selectedLabelIds() : [], // 标签ID数组
      };

      // 发送请求
      await http.post('/posts', postData, {
        withToken: true,
      });

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

  let tokenInputRef: HTMLInputElement | undefined;

  return (
    <div class="min-h-screen">
      {/* 设置弹窗 */}
      <Show when={showSettingsModal()}>
        <div class="modal-open modal">
          <div class="modal-box">
            <h3 class="text-lg font-bold">设置上传参数</h3>
            <label class="form-control mt-4 w-full">
              <div class="label">
                <span class="label-text">上传 Token</span>
              </div>
              <input
                ref={tokenInputRef}
                type="text"
                placeholder="在此输入Token"
                class="input-bordered input w-full"
                value={uploadToken()}
              />
            </label>
            <label class="form-control mt-2 w-full">
              <div class="label">
                <span class="label-text">上传 API 地址</span>
              </div>
              <input
                ref={apiUrlInputRef}
                type="text"
                placeholder="例如: http://121.62.28.11:40027/api/v1"
                class="input-bordered input w-full"
                value={uploadApiUrl()}
              />
            </label>
            <div class="modal-action mt-6">
              <button class="btn" onClick={handleCloseSettingsModal}>
                取消
              </button>
              <button
                class="btn btn-primary"
                onClick={() =>
                  handleSaveSettings(
                    tokenInputRef?.value ?? '',
                    apiUrlInputRef?.value ?? ''
                  )
                }
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </Show>

      <div class="container mx-auto flex min-h-screen flex-col px-4 py-8">
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
                ref={editorRef}
                value={text()}
                onInput={(e) => setText(e.target.value)}
                onDrop={handleEditorDrop}
                onDragOver={handleEditorDragOver}
                class="h-[calc(100vh-300px)] w-full rounded-md border border-base-200 p-4 focus:outline-none"
                placeholder="在此输入文章内容，支持Markdown格式。可以拖拽或粘贴图片到编辑器中上传。"
              />
            </Show>
            <Show when={mode() === 'preview'}>
              <div class="h-[calc(100vh-300px)] overflow-auto rounded-md border border-base-200 p-4">
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
                    class="input-bordered input w-full"
                    value={coverImage()}
                    onInput={(e) => setCoverImage(e.target.value)}
                  />
                </div>
                <div>
                  <p class="text-xs text-gray-500">
                    随机图片调用于www.dmoe.cc的接口，不代表我的个人审美
                  </p>
                  <div class="flex gap-2">
                    <button
                      class="btn mt-2 btn-sm btn-primary"
                      onClick={() =>
                        setCoverImage(
                          `https://www.dmoe.cc/random.php?t=${Date.now()}`
                        )
                      }
                    >
                      <div class="flex items-center">
                        <span class="mr-1">随机图片</span>
                      </div>
                    </button>
                    <button
                      class="btn mt-2 btn-outline btn-sm"
                      onClick={() => {
                        const input =
                          coverDropzoneRef?.querySelector('input[type="file"]');
                        if (input) (input as HTMLInputElement).click();
                      }}
                      disabled={isUploading()}
                    >
                      <div class="flex items-center">
                        <Upload class="mr-1 h-4 w-4" />
                        <span>上传图片</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              <div
                ref={coverDropzoneRef}
                class="relative h-[150px] w-[200px] overflow-hidden rounded-md border border-gray-200 bg-white dark:bg-gray-800"
                onDrop={handleCoverDrop}
                onDragOver={handleCoverDragOver}
              >
                <Show
                  when={coverImage()}
                  fallback={
                    <div class="flex h-full w-full flex-col items-center justify-center text-gray-500">
                      <Image class="mb-2 h-8 w-8" />
                      <p class="text-xs">拖拽或点击上传</p>
                      <input
                        type="file"
                        accept="image/*"
                        class="absolute inset-0 cursor-pointer opacity-0"
                        onChange={handleCoverFileSelect}
                      />
                    </div>
                  }
                >
                  <div class="group relative h-full w-full">
                    <img
                      src={coverImage()}
                      alt="封面图片"
                      class="h-full w-full object-cover"
                    />
                    <div class="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        class="btn btn-circle text-white btn-ghost btn-sm"
                        onClick={() => {
                          const input =
                            coverDropzoneRef?.querySelector(
                              'input[type="file"]'
                            );
                          if (input) (input as HTMLInputElement).click();
                        }}
                      >
                        <Upload class="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      onChange={handleCoverFileSelect}
                    />
                  </div>
                </Show>
                {isUploading() && (
                  <div class="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black">
                    <div class="loading loading-md loading-spinner text-primary"></div>
                  </div>
                )}
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
                  class="input-bordered input w-full"
                  value={tagInput()}
                  onInput={handleTagInput}
                  onKeyDown={handleTagKeyDown}
                />
              </div>
              <Show when={tags().length > 0}>
                <div class="mt-2 flex flex-wrap gap-2">
                  {tags().map((tag, index) => (
                    <div class="badge gap-1 badge-primary">
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
                class="input-bordered input w-full"
                value={title()}
                onInput={handleTitleChange}
              />
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">文章别名：</span>
              <input
                type="text"
                placeholder="输入文章别名，用于URL"
                class="input-bordered input w-full"
                value={slug()}
                onInput={(e) => setSlug(e.target.value)}
              />
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium">文章摘要：</span>
              <input
                type="text"
                placeholder="输入文章摘要（可选）"
                class="input-bordered input w-full"
                value={summary()}
                onInput={(e) => setSummary(e.target.value)}
              />
            </div>
            <div class="flex justify-end">
              <button
                class="btn mt-2 btn-primary"
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
