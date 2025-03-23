mod config;

use axum::{Router, routing::get};
use std::fs;
use std::net::SocketAddr;
use std::path::Path;
use std::sync::Arc;
use tokio::net::TcpListener;
use tracing::{Level, info};
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 创建.log目录（如果不存在）
    let log_dir = ".log";
    if !Path::new(log_dir).exists() {
        fs::create_dir(log_dir)?;
        info!("创建日志目录: {}", log_dir);
    }

    // 配置文件日志（按天滚动，使用UTF-8编码，文件后缀为.log）
    let file_appender = RollingFileAppender::builder()
        .rotation(Rotation::DAILY)
        .filename_prefix("application")
        .filename_suffix(".log")
        .build(log_dir)
        .expect("Failed to create file appender");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    // 初始化日志（同时输出到控制台和文件，使用UTF-8编码）
    tracing_subscriber::registry()
        .with(fmt::layer().with_writer(std::io::stdout))
        .with(
            fmt::layer()
                .with_writer(non_blocking)
                .with_ansi(false)
                .json()
                .with_file(true)
                .with_line_number(true),
        )
        .with(tracing_subscriber::EnvFilter::new("info"))
        .init();

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
    let app = Router::new().route("/", get(|| async { "Hello, Blog API!" }));

    // 启动服务器
    let addr = SocketAddr::new(config.server.host.parse()?, config.server.port);
    info!("服务器启动在 {}", addr);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
