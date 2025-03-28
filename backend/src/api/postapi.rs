use axum::Json;
use serde::Deserialize;

use crate::{error::AppError, model::models::post};

#[derive(Debug, Deserialize)]
struct GetPostsRequest {
    username: String,
    password: String,
}

async fn get_posts() -> Result<Json<GetPostsRequest>, AppError> {
    todo!();
}
