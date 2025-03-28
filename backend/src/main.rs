use backend::{config, logger, model, routes};
use std::net::SocketAddr;
use std::path::Path;
use std::sync::Arc;
use tokio::net::TcpListener;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 初始化日志系统
    let _log_guard = logger::init_logger()?;

    // 加载配置文件
    let config_path = Path::new("config.toml");
    let config = if config_path.exists() {
        info!("从配置文件加载配置: {:?}", config_path);
        config::Config::from_file(config_path)?
    } else {
        info!("使用默认配置");
        config::Config::default()
    };

    // 初始化全局配置
    config::init_config(config.clone());

    // 初始化数据库连接池
    let pool = model::get_db_pool(config::get_config()).await?;
    let pool = Arc::new(pool);

    // 创建应用路由
    let app = routes::create_routes(pool);

    // 启动服务器
    let addr = SocketAddr::new(
        config::get_config().server.host.parse()?,
        config::get_config().server.port,
    );
    info!("服务器启动在 {}", addr);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
