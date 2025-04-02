'use client';

import { useState, useEffect } from 'react';
import { Wrapper } from '@/components/wrapper';
import { Button } from '@/components/ui/button';
import { MdEditor } from 'md-editor-rt';
import '@vavt/cm-extension/dist/previewTheme/arknights.css';
import 'md-editor-rt/lib/style.css';
import { Image, Edit, Eye, Download, Settings } from 'lucide-react';
import { get, post } from '@/lib/http';
import { AuthState } from '@/lib/types';
import { toast } from 'sonner';
import { pinyin } from 'pinyin-pro';
// 标签接口定义
interface Label {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export default function Page() {
  // 为编辑器设置唯一ID
  const [editorId] = useState('editor-1');
  // 是否已挂载标志
  const [isMounted, setIsMounted] = useState(false);
  // 编辑器内容
  const [text, setText] = useState('EC is too lazy to write a refresh button, because he thinks \'refresh\' = \'edit\' + \'preview\'. Actually, that makes sense :D');
  // 编辑器模式：edit - 编辑模式，preview - 预览模式
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  // 封面图片URL
  const [coverImage, setCoverImage] = useState<string>('');
  // 文章标签
  const [tags, setTags] = useState<string[]>([]);
  // 标签输入
  const [tagInput, setTagInput] = useState<string>('');
  // 所有可用标签列表
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  // 选中的标签ID列表
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  // 文章标题
  const [title, setTitle] = useState<string>('');
  // 文章摘要
  const [summary, setSummary] = useState<string>('');
  // 文章slug
  const [slug, setSlug] = useState<string>('');
  // 发布状态
  const [isPublishing, setIsPublishing] = useState<boolean>(false);


  const fetchLabels = async () => {
    try {
      const response = await get('/labels');
      if (Array.isArray(response)) {
        setAvailableLabels(response as Label[]);
      } else {
        throw new Error('标签数据格式错误');
      }
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };
  // 获取所有标签
  useEffect(() => { fetchLabels() }, []);

  // 设置已挂载标志
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 处理导出文档
  const handleExport = () => {
    // 这里可以实现导出功能
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'markdown'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 处理设置
  const handleSettings = () => {
    // 这里可以实现设置功能
    alert('设置功能将在后续实现');
  };

  // 生成slug
  const generateSlug = (text: string) => {
    // 检测是否包含中文字符
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    
    let convertedText = text;
    if (hasChinese) {
      // 使用pinyin-pro将中文转换为拼音
      convertedText = pinyin(text, {
        toneType: 'none', // 去除声调
        pattern: 'pinyin', // 拼音模式
        type: 'string',   // 返回字符串格式
        nonZh: 'consecutive' // 非中文字符保持连续
      }).replace(/\s+/g, '-'); // 将空格替换为连字符
    }

    return convertedText
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/[\s_-]+/g, '-') // 将空格和下划线替换为连字符
      .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
  };

  // 处理标题变化时自动生成slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  // 创建新标签
  const createLabel = async (name: string): Promise<Label | null> => {
    try {
      const slug = generateSlug(name);
      const labelData = {
        name,
        slug,
        description: `${name}相关文章`
      };

      const response = await post('/labels', labelData);
      if (response && typeof response === 'object' && 'id' in response) {
        const newLabel = response as Label;
        setAvailableLabels([...availableLabels, newLabel]);
        return newLabel;
      } else {
        throw new Error('创建标签失败，返回数据格式错误');
      }
    } catch (error) {
      console.error('创建标签失败:', error);
      toast.error('创建标签失败，请重试');
      return null;
    }
  };

  // 处理标签输入
  const handleTagInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
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
    if (tags.includes(tagName)) {
      toast.error(`标签 "${tagName}" 已添加`);
      return;
    }

    // 检查标签是否存在于可用标签列表中
    let labelId: string | null = null;
    const existingLabel = availableLabels.find(label => label.name === tagName);

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
      setSelectedLabelIds([...selectedLabelIds, labelId]);
      setTags([...tags, tagName]);
    }
  };

  // 处理标签删除
  const removeTag = (index: number) => {
    const newTags = [...tags];
    const newLabelIds = [...selectedLabelIds];
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
      if (!title) {
        toast.error('请输入文章标题');
        return;
      }

      if (!text || text.trim().length < 10) {
        toast.error('文章内容太短');
        return;
      }

      if (!slug) {
        toast.error('请输入文章别名');
        return;
      }

      if (!coverImage) {
        toast.error('请设置封面图片');
        return;
      }

      // 从localStorage获取用户信息
      const authData = localStorage.getItem('auth');
      if (!authData) {
        toast.error('请先登录');
        return;
      }

      const authState = JSON.parse(authData) as AuthState;
      const authorId = authState.user.id;

      // 构建请求体
      const postData = {
        title,
        content: text,
        slug,
        summary: summary || title, // 如果没有摘要，使用标题
        featured_image: coverImage,
        author_id: authorId,
        published: true,
        labels: selectedLabelIds.length > 0 ? selectedLabelIds : [] // 标签ID数组
      };

      // 发送请求
      await post('/posts', postData);

      toast.success('文章发布成功！');

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
      toast.error(error instanceof Error ? error.message : '发布失败，请重试');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/20 dark:to-purple-950/20">
      <Wrapper className="flex min-h-screen flex-col py-8">
        {/* 顶部工具栏 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant={mode === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('preview')}
            >
              <Eye className="h-4 w-4" />
              <span>预览</span>
            </Button>
            <Button
              variant={mode === 'edit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('edit')}
            >
              <Edit className="h-4 w-4" />
              <span>编辑</span>
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              <span>导出</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSettings}>
              <Settings className="h-4 w-4" />
              <span>设置</span>
            </Button>
          </div>
        </div>

        {/* 编辑器区域 */}
        <div className="flex-1">
          {isMounted && (
            <MdEditor
              value={text}
              onChange={setText}
              id={editorId}
              previewTheme="arknights"
              showCodeRowNumber={true}
              className="h-[calc(100vh-300px)] rounded-md border border-input bg-background shadow-sm"
            />
          )}
        </div>

        {/* 底部区域 - 封面图片和标签 */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 封面图片上传 */}
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium">封面图片：</span>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex w-full items-center space-x-2">
                  <input
                    type="text"
                    placeholder="封面链接"
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500">随机图片调用于www.dmoe.cc的接口，不代表我的个人审美</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2 bg-purple-100 text-purple-800 hover:bg-purple-200"
                    onClick={() => setCoverImage(`https://www.dmoe.cc/random.php?t=${Date.now()}`)}
                  >
                    <div className="flex items-center">
                      <span className="mr-1">随机图片</span>
                    </div>
                  </Button>
                </div>
              </div>
              <div className="w-[200px] h-[150px] overflow-hidden rounded-md border border-gray-200 bg-white dark:bg-gray-800">
                {coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImage}
                    alt="封面图片"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-gray-500">
                    <Image className="mb-2 h-8 w-8" />
                    <p className="text-xs">预览区域</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 文章标签和标题 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">文章标签：</span>
                <input
                  type="text"
                  placeholder="输入标签，按逗号添加"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={tagInput}
                  onChange={handleTagInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (tagInput.trim()) {
                        addTag(tagInput.trim());
                        setTagInput('');
                      }
                    }
                  }}
                />
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full text-xs">
                      <span>{tag}</span>
                      <button
                        type="button"
                        className="text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                        onClick={() => removeTag(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">文章标题：</span>
              <input
                type="text"
                placeholder="输入文章标题"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={title}
                onChange={handleTitleChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">文章别名：</span>
              <input
                type="text"
                placeholder="输入文章别名，用于URL"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">文章摘要：</span>
              <input
                type="text"
                placeholder="输入文章摘要（可选）"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                className="mt-2"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? '发布中...' : '发布'}
              </Button>
            </div>
          </div>
        </div>
      </Wrapper>
    </div>
  );
}