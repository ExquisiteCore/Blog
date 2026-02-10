use backend::{config, llm::LlmClient, logger, migration, routes, state::AppState};
use sea_orm::{ConnectOptions, Database};
use sea_orm_migration::MigratorTrait;
use std::net::SocketAddr;
use std::path::Path;
use std::time::Duration;
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

    // 初始化 SeaORM 数据库连接
    let mut opt = ConnectOptions::new(&config.database.url);
    opt.max_connections(config.database.max_connections)
        .min_connections(1)
        .connect_timeout(Duration::from_secs(10))
        .idle_timeout(Duration::from_secs(600));

    let conn = Database::connect(opt).await?;
    info!("数据库连接成功");

    // 运行数据库迁移
    migration::Migrator::up(&conn, None).await?;
    info!("数据库迁移完成");

    // 初始化 LLM 客户端（如果配置了）
    let llm_client = config.llm.map(|lc| {
        info!("初始化 LLM 客户端，provider: {}", lc.provider);
        LlmClient::new(lc)
    });

    // 创建应用状态
    let app_state = AppState::new(conn, llm_client);

    // 创建应用路由
    let app = routes::create_routes(app_state);

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
