use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "like")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub identity_id: Uuid,
    pub content_metadata_id: Uuid,
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::identity::Entity",
        from = "Column::IdentityId",
        to = "super::identity::Column::Id"
    )]
    Identity,
    #[sea_orm(
        belongs_to = "super::content_metadata::Entity",
        from = "Column::ContentMetadataId",
        to = "super::content_metadata::Column::Id"
    )]
    ContentMetadata,
}

impl Related<super::identity::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Identity.def()
    }
}

impl Related<super::content_metadata::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ContentMetadata.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
