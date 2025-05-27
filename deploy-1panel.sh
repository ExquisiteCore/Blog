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
ONEPANEL_OPENRESTY_CONF_DIR="/opt/1panel/apps/openresty/openresty/conf/conf.d"
ONEPANEL_SSL_DIR="/opt/1panel/apps/openresty/openresty/conf/ssl"
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

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "检测到root用户，建议使用普通用户运行此脚本"
    fi
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
    
    # 检查1Panel OpenResty是否安装
    if [[ ! -d "/opt/1panel/apps/openresty" ]]; then
        log_error "未检测到1Panel OpenResty安装，请先在1Panel面板中安装OpenResty"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 检查1Panel OpenResty状态
check_openresty_status() {
    log_info "检查1Panel OpenResty状态..."
    
    if docker ps | grep -q "1panel-openresty"; then
        log_success "1Panel OpenResty 正在运行"
    else
        log_warning "1Panel OpenResty 未运行，请在1Panel面板中启动OpenResty"
        read -p "按回车键继续，或按Ctrl+C退出: "
    fi
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
        local postgres_pass=$(openssl rand -base64 32)
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${postgres_pass}/" .env
        log_success "已生成新的数据库密码"
    fi
    
    if ! grep -q "JWT_SECRET=" .env || grep -q "your_super_secret_jwt_key" .env; then
        local jwt_secret=$(openssl rand -base64 64)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=${jwt_secret}/" .env
        log_success "已生成新的JWT密钥"
    fi
    
    # 更新API地址为生产环境
    if [[ "$1" == "prod" ]]; then
        read -p "请输入您的域名 (例如: yourdomain.com): " domain
        if [[ -n "$domain" ]]; then
            sed -i "s|PUBLIC_API_BASE_URL=.*|PUBLIC_API_BASE_URL=https://${domain}/api|" .env
            log_success "已更新API地址为: https://${domain}/api"
        fi
    fi
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "logs"
    mkdir -p "ssl"
    
    log_success "目录创建完成"
}

# 构建Docker镜像
build_images() {
    log_info "构建Docker镜像..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    log_success "镜像构建完成"
}

# 安装OpenResty配置
install_openresty_config() {
    local domain=${1:-"yourdomain.com"}
    
    log_info "安装OpenResty配置..."
    
    # 检查是否有权限访问1Panel配置目录
    if [[ ! -w "$ONEPANEL_OPENRESTY_CONF_DIR" ]]; then
        log_warning "需要sudo权限来配置OpenResty"
        sudo_cmd="sudo"
    else
        sudo_cmd=""
    fi
    
    # 复制配置文件
    if [[ -f "1panel-configs/blog-site.conf" ]]; then
        # 替换域名
        sed "s/yourdomain.com/$domain/g" 1panel-configs/blog-site.conf > /tmp/blog-site.conf
        
        $sudo_cmd cp /tmp/blog-site.conf "$ONEPANEL_OPENRESTY_CONF_DIR/"
        rm /tmp/blog-site.conf
        
        log_success "OpenResty配置已安装到: $ONEPANEL_OPENRESTY_CONF_DIR/blog-site.conf"
    else
        log_error "OpenResty配置文件不存在: 1panel-configs/blog-site.conf"
        exit 1
    fi
    
    # 重载OpenResty配置
    reload_openresty
}

# 重载OpenResty配置
reload_openresty() {
    log_info "重载OpenResty配置..."
    
    # 测试配置文件语法
    if docker exec 1panel-openresty nginx -t; then
        docker exec 1panel-openresty nginx -s reload
        log_success "OpenResty配置重载成功"
    else
        log_error "OpenResty配置语法错误，请检查配置文件"
        exit 1
    fi
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

# 更新应用
update_app() {
    log_info "更新应用..."
    
    # 备份数据库
    backup_database
    
    # 停止服务
    stop_services
    
    # 拉取最新代码
    git pull origin main
    
    # 重新构建镜像
    build_images
    
    # 启动服务
    start_services
    
    log_success "应用更新完成"
}

# 清理资源
cleanup() {
    log_info "清理Docker资源..."
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理未使用的卷
    docker volume prune -f
    
    # 清理未使用的网络
    docker network prune -f
    
    log_success "清理完成"
}

# 卸载配置
uninstall_config() {
    log_warning "移除OpenResty配置..."
    
    if [[ -f "$ONEPANEL_OPENRESTY_CONF_DIR/blog-site.conf" ]]; then
        if [[ ! -w "$ONEPANEL_OPENRESTY_CONF_DIR" ]]; then
            sudo rm "$ONEPANEL_OPENRESTY_CONF_DIR/blog-site.conf"
        else
            rm "$ONEPANEL_OPENRESTY_CONF_DIR/blog-site.conf"
        fi
        
        reload_openresty
        log_success "OpenResty配置已移除"
    else
        log_info "OpenResty配置文件不存在"
    fi
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
    
    # 磁盘使用情况
    echo -e "\n${BLUE}磁盘使用情况:${NC}"
    df -h . | tail -1
    
    # 内存使用情况
    echo -e "\n${BLUE}内存使用情况:${NC}"
    free -h
}

# 显示帮助信息
show_help() {
    cat << EOF
1Panel OpenResty 博客系统部署脚本

用法: $0 <命令> [参数]

命令:
  setup              设置环境配置
  install <domain>   安装OpenResty配置 (域名可选)
  build              构建Docker镜像
  start              启动所有服务
  stop               停止所有服务
  restart            重启所有服务
  status             显示系统状态
  health             检查服务健康状态
  logs [service]     查看日志 (可指定服务名)
  backup             备份数据库
  restore <file>     恢复数据库
  update             更新应用
  cleanup            清理Docker资源
  uninstall          移除OpenResty配置
  reload-nginx       重载OpenResty配置

示例:
  $0 setup                    # 初始化环境
  $0 install example.com      # 安装配置并设置域名
  $0 start                    # 启动服务
  $0 logs backend             # 查看后端日志
  $0 backup                   # 备份数据库
  $0 restore backup.sql       # 恢复数据库

注意事项:
  - 请确保已安装1Panel面板和OpenResty
  - 首次运行请先执行 setup 命令
  - 生产环境请先配置SSL证书
  - 建议定期备份数据库

EOF
}

# 主函数
main() {
    cd "$SCRIPT_DIR"
    
    case "${1:-help}" in
        "setup")
            check_root
            check_dependencies
            setup_env "${2:-dev}"
            create_directories
            ;;
        "install")
            check_dependencies
            check_openresty_status
            install_openresty_config "${2:-yourdomain.com}"
            ;;
        "build")
            check_dependencies
            build_images
            ;;
        "start")
            check_dependencies
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
        "update")
            update_app
            ;;
        "cleanup")
            cleanup
            ;;
        "uninstall")
            uninstall_config
            ;;
        "reload-nginx")
            reload_openresty
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"