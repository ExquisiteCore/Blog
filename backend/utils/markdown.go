package utils

import (
	"fmt"
	"strings"

	"github.com/yuin/goldmark"
	"gopkg.in/yaml.v2"
)

type MarkdownData struct {
	Metadata map[string]interface{} `json:"metadata"`
	Body     string                 `json:"body"`
	HTML     string                 `json:"html"`
}

// ParseMarkdown 解析 Markdown 文本，将 YAML front matter 和正文分离并返回
func ParseMarkdown(md string) (*MarkdownData, error) {
	// 将 Markdown 文本按 "---" 分割为三部分
	sections := strings.SplitN(md, "---", 3)
	if len(sections) < 3 {
		return nil, fmt.Errorf("invalid markdown format") // 返回错误信息，如果格式不正确
	}

	// 解析 YAML front matter
	var metadata map[string]interface{}
	err := yaml.Unmarshal([]byte(sections[1]), &metadata)
	if err != nil {
		return nil, err // 如果解析失败，返回错误信息
	}
	// 获取 Body 内容
	body := strings.TrimSpace(sections[2])
	// 将 Body 转换为 HTML
	var htmlBuilder strings.Builder
	markdown := goldmark.New()
	if err := markdown.Convert([]byte(body), &htmlBuilder); err != nil {
		return nil, err
	}

	// 返回解析后的数据
	return &MarkdownData{
		Metadata: metadata,
		Body:     body,
		HTML:     htmlBuilder.String(),
	}, nil
}
