use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ========== users ==========
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(uuid(Users::Id).primary_key())
                    .col(string_len(Users::Username, 50).unique_key().not_null())
                    .col(string_len(Users::Email, 100).unique_key().not_null())
                    .col(string(Users::PasswordHash).not_null())
                    .col(string_len_null(Users::DisplayName, 100))
                    .col(string_null(Users::AvatarUrl))
                    .col(text_null(Users::Bio))
                    .col(
                        string_len(Users::Role, 20)
                            .not_null()
                            .default("user"),
                    )
                    .col(
                        timestamp_with_time_zone(Users::CreatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        timestamp_with_time_zone(Users::UpdatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // ========== content_metadata ==========
        manager
            .create_table(
                Table::create()
                    .table(ContentMetadata::Table)
                    .if_not_exists()
                    .col(uuid(ContentMetadata::Id).primary_key())
                    .col(
                        string_len(ContentMetadata::Slug, 255)
                            .unique_key()
                            .not_null(),
                    )
                    .col(
                        string_len(ContentMetadata::ContentType, 20)
                            .not_null()
                            .default("article"),
                    )
                    .col(json_binary_null(ContentMetadata::CoverImages))
                    .col(json_binary_null(ContentMetadata::Tags))
                    .col(
                        string_len(ContentMetadata::OriginalLang, 10)
                            .not_null()
                            .default("zh-CN"),
                    )
                    .col(
                        integer(ContentMetadata::ViewCount)
                            .not_null()
                            .default(0),
                    )
                    .col(
                        integer(ContentMetadata::CommentCount)
                            .not_null()
                            .default(0),
                    )
                    .col(
                        integer(ContentMetadata::LikeCount)
                            .not_null()
                            .default(0),
                    )
                    .col(uuid(ContentMetadata::AuthorId).not_null())
                    .col(
                        boolean(ContentMetadata::Published)
                            .not_null()
                            .default(false),
                    )
                    .col(timestamp_with_time_zone_null(ContentMetadata::PublishedAt))
                    .col(
                        timestamp_with_time_zone(ContentMetadata::CreatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        timestamp_with_time_zone(ContentMetadata::UpdatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ContentMetadata::Table, ContentMetadata::AuthorId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // ========== content ==========
        manager
            .create_table(
                Table::create()
                    .table(Content::Table)
                    .if_not_exists()
                    .col(uuid(Content::Id).primary_key())
                    .col(uuid(Content::ContentMetadataId).not_null())
                    .col(
                        string_len(Content::LangCode, 10)
                            .not_null()
                            .default("zh-CN"),
                    )
                    .col(string(Content::Title).not_null())
                    .col(text_null(Content::Summary))
                    .col(text(Content::Content).not_null())
                    .col(text_null(Content::RenderedHtml))
                    .col(json_binary_null(Content::Toc))
                    .col(
                        timestamp_with_time_zone(Content::CreatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        timestamp_with_time_zone(Content::UpdatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Content::Table, Content::ContentMetadataId)
                            .to(ContentMetadata::Table, ContentMetadata::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // UNIQUE index: (content_metadata_id, lang_code)
        manager
            .create_index(
                Index::create()
                    .name("idx_content_metadata_lang")
                    .table(Content::Table)
                    .col(Content::ContentMetadataId)
                    .col(Content::LangCode)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // ========== label ==========
        manager
            .create_table(
                Table::create()
                    .table(Label::Table)
                    .if_not_exists()
                    .col(uuid(Label::Id).primary_key())
                    .col(string_len(Label::Name, 100).unique_key().not_null())
                    .col(string_len(Label::Slug, 100).unique_key().not_null())
                    .col(text_null(Label::Description))
                    .col(
                        timestamp_with_time_zone(Label::CreatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        timestamp_with_time_zone(Label::UpdatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // ========== content_label ==========
        manager
            .create_table(
                Table::create()
                    .table(ContentLabel::Table)
                    .if_not_exists()
                    .col(uuid(ContentLabel::ContentMetadataId).not_null())
                    .col(uuid(ContentLabel::LabelId).not_null())
                    .primary_key(
                        Index::create()
                            .col(ContentLabel::ContentMetadataId)
                            .col(ContentLabel::LabelId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ContentLabel::Table, ContentLabel::ContentMetadataId)
                            .to(ContentMetadata::Table, ContentMetadata::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(ContentLabel::Table, ContentLabel::LabelId)
                            .to(Label::Table, Label::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // ========== identity ==========
        manager
            .create_table(
                Table::create()
                    .table(Identity::Table)
                    .if_not_exists()
                    .col(uuid(Identity::Id).primary_key())
                    .col(uuid_null(Identity::Uuid).unique_key())
                    .col(uuid_null(Identity::UserId))
                    .col(
                        timestamp_with_time_zone(Identity::CreatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        timestamp_with_time_zone(Identity::UpdatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Identity::Table, Identity::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // ========== like ==========
        manager
            .create_table(
                Table::create()
                    .table(Like::Table)
                    .if_not_exists()
                    .col(uuid(Like::Id).primary_key())
                    .col(uuid(Like::IdentityId).not_null())
                    .col(uuid(Like::ContentMetadataId).not_null())
                    .col(
                        timestamp_with_time_zone(Like::CreatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Like::Table, Like::IdentityId)
                            .to(Identity::Table, Identity::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Like::Table, Like::ContentMetadataId)
                            .to(ContentMetadata::Table, ContentMetadata::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // UNIQUE index: (identity_id, content_metadata_id)
        manager
            .create_index(
                Index::create()
                    .name("idx_like_identity_content")
                    .table(Like::Table)
                    .col(Like::IdentityId)
                    .col(Like::ContentMetadataId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // ========== comments ==========
        manager
            .create_table(
                Table::create()
                    .table(Comments::Table)
                    .if_not_exists()
                    .col(uuid(Comments::Id).primary_key())
                    .col(uuid(Comments::IdentityId).not_null())
                    .col(uuid(Comments::ContentMetadataId).not_null())
                    .col(uuid_null(Comments::ParentId))
                    .col(text(Comments::Content).not_null())
                    .col(
                        boolean(Comments::IsDeleted)
                            .not_null()
                            .default(false),
                    )
                    .col(
                        timestamp_with_time_zone(Comments::CreatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        timestamp_with_time_zone(Comments::UpdatedAt)
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Comments::Table, Comments::IdentityId)
                            .to(Identity::Table, Identity::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Comments::Table, Comments::ContentMetadataId)
                            .to(ContentMetadata::Table, ContentMetadata::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Comments::Table, Comments::ParentId)
                            .to(Comments::Table, Comments::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // ========== Performance Indexes ==========
        manager
            .create_index(
                Index::create()
                    .name("idx_content_metadata_type_published")
                    .table(ContentMetadata::Table)
                    .col(ContentMetadata::ContentType)
                    .col(ContentMetadata::Published)
                    .col(ContentMetadata::PublishedAt)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_content_metadata_view_count")
                    .table(ContentMetadata::Table)
                    .col(ContentMetadata::ViewCount)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_content_metadata_author")
                    .table(ContentMetadata::Table)
                    .col(ContentMetadata::AuthorId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_content_label_label")
                    .table(ContentLabel::Table)
                    .col(ContentLabel::LabelId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_identity_uuid")
                    .table(Identity::Table)
                    .col(Identity::Uuid)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_like_content_metadata")
                    .table(Like::Table)
                    .col(Like::ContentMetadataId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_comments_content_metadata")
                    .table(Comments::Table)
                    .col(Comments::ContentMetadataId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_comments_parent")
                    .table(Comments::Table)
                    .col(Comments::ParentId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Comments::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Like::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Identity::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(ContentLabel::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Label::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Content::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(ContentMetadata::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await?;
        Ok(())
    }
}

// ========== Table Identifiers ==========

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
    Username,
    Email,
    PasswordHash,
    DisplayName,
    AvatarUrl,
    Bio,
    Role,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum ContentMetadata {
    Table,
    Id,
    Slug,
    ContentType,
    CoverImages,
    Tags,
    OriginalLang,
    ViewCount,
    CommentCount,
    LikeCount,
    AuthorId,
    Published,
    PublishedAt,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Content {
    Table,
    Id,
    ContentMetadataId,
    LangCode,
    Title,
    Summary,
    Content,
    RenderedHtml,
    Toc,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Label {
    Table,
    Id,
    Name,
    Slug,
    Description,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum ContentLabel {
    Table,
    ContentMetadataId,
    LabelId,
}

#[derive(DeriveIden)]
enum Identity {
    Table,
    Id,
    Uuid,
    UserId,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Like {
    Table,
    Id,
    IdentityId,
    ContentMetadataId,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Comments {
    Table,
    Id,
    IdentityId,
    ContentMetadataId,
    ParentId,
    Content,
    IsDeleted,
    CreatedAt,
    UpdatedAt,
}
