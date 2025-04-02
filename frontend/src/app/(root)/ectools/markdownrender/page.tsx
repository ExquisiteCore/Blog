'use client';

import { useState } from 'react';
import { Wrapper } from '@/components/wrapper';
import { Button } from '@/components/ui/button';
import { MdEditor } from 'md-editor-rt';
import '@vavt/cm-extension/dist/previewTheme/arknights.css';
import 'md-editor-rt/lib/style.css';
import { Upload, Edit, Eye, Download, Settings } from 'lucide-react';

export default function Page() {
  // 为编辑器设置唯一ID
  const [editorId] = useState('editor-1');
  // 编辑器内容
  const [text, setText] = useState('EC is too lazy to write a refresh button, because he thinks \'refresh\' = \'edit\' + \'preview\'. Actually, that makes sense :D');
  // 编辑器模式：edit - 编辑模式，preview - 预览模式
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  // 封面图片URL
  const [coverImage] = useState<string>('');
  // 文章标签
  const [tags, setTags] = useState<string[]>([]);
  // 文章标题
  const [title, setTitle] = useState<string>('');

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
          <MdEditor
            modelValue={text}
            onChange={setText}
            id={editorId}
            previewTheme="arknights"
            showCodeRowNumber={true}
            className="h-[calc(100vh-300px)] rounded-md border border-input bg-background shadow-sm"
          />
        </div>

        {/* 底部区域 - 封面图片和标签 */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 封面图片上传 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">封面图片：</span>
            <div className="flex-1">
              <div className="flex h-32 w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 bg-white dark:bg-gray-800">
                {coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImage}
                    alt="封面图片"
                    className="h-full w-full object-cover rounded-md"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Upload className="mb-2 h-8 w-8" />
                    <p className="text-xs">点击这里上传封面图片</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 文章标签和标题 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">文章标签：</span>
              <input
                type="text"
                placeholder="输入标签，用逗号分隔"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={tags.join(', ')}
                onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">文章标题：</span>
              <input
                type="text"
                placeholder="输入文章标题"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" className="mt-2">
                发布
              </Button>
            </div>
          </div>
        </div>
      </Wrapper>
    </div>
  );
}