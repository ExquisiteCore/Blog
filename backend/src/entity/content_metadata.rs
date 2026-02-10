use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "content_metadata")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub slug: String,
    #[sea_orm(default_value = "article")]
    pub content_type: String,
    #[sea_orm(column_type = "JsonBinary", nullable)]
    pub cover_images: Option<Json>,
    #[sea_orm(column_type = "JsonBinary", nullable)]
    pub tags: Option<Json>,
    #[sea_orm(default_value = "zh-CN")]
    pub original_lang: String,
    #[sea_orm(default_value = 0)]
    pub view_count: i32,
    #[sea_orm(default_value = 0)]
    pub comment_count: i32,
    #[sea_orm(default_value = 0)]
    pub like_count: i32,
    pub author_id: Uuid,
    #[sea_orm(default_value = false)]
    pub published: bool,
    pub published_at: Option<DateTimeWithTimeZone>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::AuthorId",
        to = "super::user::Column::Id"
    )]
    Author,
    #[sea_orm(has_many = "super::content::Entity")]
    Content,
    #[sea_orm(has_many = "super::content_label::Entity")]
    ContentLabel,
    #[sea_orm(has_many = "super::like::Entity")]
    Like,
    #[sea_orm(has_many = "super::comment::Entity")]
    Comment,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Author.def()
    }
}

impl Related<super::content::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Content.def()
    }
}

impl Related<super::label::Entity> for Entity {
    fn via() -> Option<RelationDef> {
        Some(super::content_label::Relation::ContentMetadata.def().rev())
    }

    fn to() -> RelationDef {
        super::content_label::Relation::Label.def()
    }
}

impl Related<super::like::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Like.def()
    }
}

impl Related<super::comment::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Comment.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
