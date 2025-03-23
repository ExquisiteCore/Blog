mod config;
mod logger;

use axum::{Router, routing::get};
use std::net::SocketAddr;
use std::path::Path;
use std::sync::Arc;
use tokio::net::TcpListener;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 初始化日志系统
    logger::init_logger()?;

    // 加载配置文件
    let config_path = Path::new("config.toml");
    let config = if config_path.exists() {
        info!("从配置文件加载配置: {:?}", config_path);
        config::Config::from_file(config_path)?
    } else {
        info!("使用默认配置");
        config::Config::default()
    };
    let config = Arc::new(config);

    // 创建应用路由
    let app = Router::new().route("/test", get(|| async { "Hello, Blog API!" }));

    // 启动服务器
    let addr = SocketAddr::new(config.server.host.parse()?, config.server.port);
    info!("服务器启动在 {}", addr);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
