use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "content_label")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub content_metadata_id: Uuid,
    #[sea_orm(primary_key, auto_increment = false)]
    pub label_id: Uuid,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::content_metadata::Entity",
        from = "Column::ContentMetadataId",
        to = "super::content_metadata::Column::Id"
    )]
    ContentMetadata,
    #[sea_orm(
        belongs_to = "super::label::Entity",
        from = "Column::LabelId",
        to = "super::label::Column::Id"
    )]
    Label,
}

impl Related<super::content_metadata::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ContentMetadata.def()
    }
}

impl Related<super::label::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Label.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
