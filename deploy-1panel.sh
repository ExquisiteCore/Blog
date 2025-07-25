#!/bin/bash

# 1Panel 博客系统部署脚本
# 适用于使用1Panel面板的服务器环境
# 使用1Panel的容器编排功能部署Docker Compose项目

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="blog"
DOCKER_COMPOSE_FILE="docker-compose.1panel.yml"
BACKUP_DIR="./backup"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    local deps=("docker" "docker-compose")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep 未安装，请先安装后再运行此脚本"
            exit 1
        fi
    done
    
    log_success "依赖检查完成"
}

# 设置环境配置
setup_env() {
    log_info "设置环境配置..."
    
    if [[ ! -f ".env" ]]; then
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            log_success "已从模板创建 .env 文件"
        else
            log_error ".env.example 文件不存在"
            exit 1
        fi
    fi
    
    # 生成随机密码
    if ! grep -q "POSTGRES_PASSWORD=" .env || grep -q "secure_password_change_me" .env; then
        local postgres_pass=$(openssl rand -hex 32)
        sed "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${postgres_pass}/" .env > .env.tmp && mv .env.tmp .env
        log_success "已生成新的数据库密码"
    fi
    
    if ! grep -q "JWT_SECRET=" .env || grep -q "your_super_secret_jwt_key" .env; then
        local jwt_secret=$(openssl rand -hex 64)
        sed "s/JWT_SECRET=.*/JWT_SECRET=${jwt_secret}/" .env > .env.tmp && mv .env.tmp .env
        log_success "已生成新的JWT密钥"
    fi
    
    # 更新API地址为生产环境
    read -p "请输入您的域名 (例如: yourdomain.com，留空使用默认): " domain
    if [[ -n "$domain" ]]; then
        sed "s|PUBLIC_API_BASE_URL=.*|PUBLIC_API_BASE_URL=https://${domain}/api|" .env > .env.tmp && mv .env.tmp .env
        log_success "已更新API地址为: https://${domain}/api"
    fi
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    
    mkdir -p "$BACKUP_DIR"
    
    log_success "目录创建完成"
}

# 构建Docker镜像
build_images() {
    log_info "构建Docker镜像..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    log_success "镜像构建完成"
}

# 显示1Panel部署说明
show_1panel_deployment_guide() {
    local domain=${1:-"yourdomain.com"}
    
    log_info "=== 1Panel 部署指南 ==="
    log_info ""
    log_info "请按以下步骤在1Panel中部署博客系统："
    log_info ""
    log_info "=== 方法一：使用容器编排（推荐） ==="
    log_info "1. 登录1Panel管理面板"
    log_info "2. 进入 '容器' -> '编排'"
    log_info "3. 点击 '创建编排'"
    log_info "4. 填写信息："
    log_info "   - 名称：blog-system"
    log_info "   - 描述：博客系统"
    log_info "   - 路径：$(pwd)"
    log_info "5. 在 'Compose 文件' 中选择：$(pwd)/$DOCKER_COMPOSE_FILE"
    log_info "6. 在 '环境变量' 中选择：$(pwd)/.env"
    log_info "7. 点击 '创建'"
    log_info "8. 在编排列表中点击 '启动'"
    log_info ""
    log_info "=== 方法二：使用网站反向代理 ==="
    log_info "1. 先使用上面的方法启动容器"
    log_info "2. 进入 '网站' -> '网站管理'"
    log_info "3. 点击 '创建网站'"
    log_info "4. 选择 '反向代理' 类型"
    log_info "5. 填写信息："
    log_info "   - 主域名：$domain"
    log_info "   - 代理地址：http://127.0.0.1:4321"
    log_info "6. 在 '证书' 选项卡中申请SSL证书（可选）"
    log_info "7. 保存并启用网站"
    log_info ""
    log_info "=== API代理配置（可选） ==="
    log_info "如果需要单独代理API，可在网站配置中添加："
    log_info ""
    cat << 'EOF'
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
EOF
    log_info ""
    log_info "=== 部署完成后 ==="
    log_info "1. 前端访问：http://$domain 或 https://$domain"
    log_info "2. API访问：http://$domain/api 或 https://$domain/api"
    log_info "3. 可在1Panel中监控容器状态和日志"
    log_info ""
}

# 显示容器状态
show_container_status() {
    log_info "检查容器状态..."
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps --services --quiet >/dev/null 2>&1; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    else
        log_warning "未找到运行中的容器，请先在1Panel中启动编排"
    fi
}

# 查看日志
view_logs() {
    local service=${1:-""}
    
    log_info "查看容器日志..."
    log_info "提示：也可以在1Panel的容器管理中查看日志"
    
    if [[ -n "$service" ]]; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f "$service"
    else
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
    fi
}

# 备份数据库
backup_database() {
    local backup_file="$BACKUP_DIR/blog_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log_info "备份数据库到: $backup_file"
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U postgres Blog > "$backup_file"
    
    if [[ -f "$backup_file" ]]; then
        gzip "$backup_file"
        log_success "数据库备份完成: ${backup_file}.gz"
    else
        log_error "数据库备份失败"
        exit 1
    fi
}

# 恢复数据库
restore_database() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    log_info "恢复数据库从: $backup_file"
    
    # 如果是压缩文件，先解压
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U postgres -d Blog
    else
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U postgres -d Blog < "$backup_file"
    fi
    
    log_success "数据库恢复完成"
}

# 显示帮助信息
show_help() {
    cat << EOF
1Panel 博客系统部署脚本

用法: $0 <命令> [参数]

命令:
  setup              设置环境配置
  guide <domain>     显示1Panel部署指南
  build              构建Docker镜像
  status             显示容器状态
  logs [service]     查看日志 (可指定服务名)
  backup             备份数据库
  restore <file>     恢复数据库

示例:
  $0 setup                    # 初始化环境
  $0 guide example.com        # 显示部署指南
  $0 build                    # 构建镜像
  $0 status                   # 查看状态
  $0 logs backend             # 查看后端日志
  $0 backup                   # 备份数据库
  $0 restore backup.sql       # 恢复数据库

1Panel 部署步骤：
  1. 运行 '$0 setup' 初始化环境
  2. 运行 '$0 build' 构建镜像（可选）
  3. 运行 '$0 guide yourdomain.com' 查看部署指南
  4. 在1Panel中按指南操作
  5. 使用 '$0 status' 和 '$0 logs' 监控服务

注意事项：
  - 请确保已安装1Panel面板
  - 服务的启动/停止请在1Panel中操作
  - SSL证书通过1Panel的网站管理自动获取
  - 建议定期备份数据库

EOF
}

# 主函数
main() {
    cd "$SCRIPT_DIR"
    
    case "${1:-help}" in
        "setup")
            check_dependencies
            setup_env
            create_directories
            ;;
        "guide")
            show_1panel_deployment_guide "${2:-yourdomain.com}"
            ;;
        "build")
            build_images
            ;;
        "status")
            show_container_status
            ;;
        "logs")
            view_logs "$2"
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            if [[ -z "$2" ]]; then
                log_error "请指定备份文件路径"
                exit 1
            fi
            restore_database "$2"
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"