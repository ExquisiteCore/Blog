use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, sea_orm::FromJsonQueryResult)]
pub struct TocItem {
    pub id: String,
    pub text: String,
    pub level: u32,
}

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "content")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub content_metadata_id: Uuid,
    #[sea_orm(default_value = "zh-CN")]
    pub lang_code: String,
    pub title: String,
    pub summary: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub content: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub rendered_html: Option<String>,
    #[sea_orm(column_type = "JsonBinary", nullable)]
    pub toc: Option<Json>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::content_metadata::Entity",
        from = "Column::ContentMetadataId",
        to = "super::content_metadata::Column::Id"
    )]
    ContentMetadata,
}

impl Related<super::content_metadata::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ContentMetadata.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
