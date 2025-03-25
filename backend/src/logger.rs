use std::fs;
use std::path::Path;
use tracing::info;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt};

pub fn init_logger() -> Result<impl std::fmt::Debug, Box<dyn std::error::Error>> {
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
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

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

    Ok(guard)
}
