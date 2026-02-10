use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "label")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub name: String,
    #[sea_orm(unique)]
    pub slug: String,
    pub description: Option<String>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::content_label::Entity")]
    ContentLabel,
}

impl Related<super::content_metadata::Entity> for Entity {
    fn via() -> Option<RelationDef> {
        Some(super::content_label::Relation::Label.def().rev())
    }

    fn to() -> RelationDef {
        super::content_label::Relation::ContentMetadata.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
