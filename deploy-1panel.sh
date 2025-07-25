#!/bin/bash

# 1Panel OpenResty 博客系统部署脚本
# 适用于使用1Panel面板管理的服务器环境

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
    
    local deps=("docker" "docker-compose" "curl")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep 未安装，请先安装后再运行此脚本"
            exit 1
        fi
    done
    
    # 检查1Panel OpenResty是否安装 (可通过环境变量跳过)
    if [[ ! -d "/opt/1panel/apps/openresty" ]] && [[ "${SKIP_1PANEL_CHECK:-false}" != "true" ]]; then
        log_warning "未检测到1Panel OpenResty安装"
        log_info "如果您在开发环境中运行，可以使用以下命令跳过检查："
        log_info "SKIP_1PANEL_CHECK=true ./deploy-1panel.sh setup"
        log_info "或者请在服务器上先安装1Panel面板和OpenResty"
        exit 1
    fi
    
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
    mkdir -p "logs"
    
    log_success "目录创建完成"
}

# 构建Docker镜像
build_images() {
    log_info "构建Docker镜像..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    log_success "镜像构建完成"
}

# 生成1Panel配置说明
show_1panel_config() {
    local domain=${1:-"yourdomain.com"}
    
    log_info "1Panel OpenResty 配置说明"
    log_info ""
    log_info "请在1Panel面板中按以下步骤操作："
    log_info ""
    log_info "1. 进入 网站 -> 网站管理"
    log_info "2. 点击 '创建网站'"
    log_info "3. 选择 '反向代理' 类型"
    log_info "4. 设置域名: $domain"
    log_info "5. 代理地址: http://127.0.0.1:4321"
    log_info "6. 在'自定义配置'中添加以下配置："
    log_info ""
    log_info "=== 复制下面的配置内容 ==="
    cat << 'EOF'
    # API代理配置
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

    # 静态文件缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:4321;
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_set_header Host $host;
    }

    # 其他请求代理到前端
    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
EOF
    log_info "=== 配置内容结束 ==="
    log_info ""
    log_info "7. 如需SSL，在网站创建后点击SSL页面申请证书"
    log_info ""
}

# 启动服务
start_services() {
    log_info "启动博客服务..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_services_health
}

# 停止服务
stop_services() {
    log_info "停止博客服务..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启博客服务..."
    
    stop_services
    start_services
}

# 检查服务健康状态
check_services_health() {
    log_info "检查服务健康状态..."
    
    local services=("postgres" "backend" "frontend")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps "$service" | grep -q "Up (healthy)"; then
            log_success "$service 服务健康"
        else
            log_error "$service 服务不健康"
            all_healthy=false
        fi
    done
    
    # 测试端口连通性
    local ports=("4321" "8080" "5432")
    for port in "${ports[@]}"; do
        if nc -z localhost "$port" 2>/dev/null; then
            log_success "端口 $port 可访问"
        else
            log_warning "端口 $port 不可访问"
            all_healthy=false
        fi
    done
    
    if $all_healthy; then
        log_success "所有服务都已正常运行"
        log_info "前端访问: http://localhost:4321"
        log_info "后端API: http://localhost:8080/api"
    else
        log_warning "部分服务存在问题，请检查日志"
    fi
}

# 查看日志
view_logs() {
    local service=${1:-""}
    
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

# 显示状态
show_status() {
    log_info "=== 博客系统状态 ==="
    
    # Docker服务状态
    echo -e "\n${BLUE}Docker服务状态:${NC}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    # 端口监听状态
    echo -e "\n${BLUE}端口监听状态:${NC}"
    netstat -tlnp | grep -E "(4321|8080|5432)" || echo "未找到相关端口"
}

# 显示帮助信息
show_help() {
    cat << EOF
1Panel OpenResty 博客系统部署脚本

用法: $0 <命令> [参数]

命令:
  setup              设置环境配置
  config <domain>    显示1Panel配置说明
  build              构建Docker镜像
  start              启动所有服务
  stop               停止所有服务
  restart            重启所有服务
  status             显示系统状态
  health             检查服务健康状态
  logs [service]     查看日志 (可指定服务名)
  backup             备份数据库
  restore <file>     恢复数据库

示例:
  $0 setup                    # 初始化环境
  $0 config example.com       # 显示1Panel配置说明
  $0 start                    # 启动服务
  $0 logs backend             # 查看后端日志
  $0 backup                   # 备份数据库
  $0 restore backup.sql       # 恢复数据库

注意事项:
  - 请确保已安装1Panel面板和OpenResty
  - 首次运行请先执行 setup 和 start 命令
  - 然后执行 config 命令获取1Panel配置说明
  - SSL证书通过1Panel面板自动管理
  - 建议定期备份数据库

EOF
}

# 主函数
main() {
    cd "$SCRIPT_DIR"
    
    case "${1:-help}" in
        "setup")
            if [[ "${SKIP_1PANEL_CHECK:-false}" != "true" ]]; then
                check_dependencies
            else
                log_warning "跳过1Panel检查 - 开发环境模式"
            fi
            setup_env
            create_directories
            ;;
        "config")
            show_1panel_config "${2:-yourdomain.com}"
            ;;
        "build")
            build_images
            ;;
        "start")
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "status")
            show_status
            ;;
        "health")
            check_services_health
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