use agent_client_protocol::Error;
use goose_sdk_types::custom_requests::{
    EmptyResponse, HarnessFetchRequest, HarnessFetchResponse, HarnessKindDto, HarnessListItemDto,
    HarnessListRequest, HarnessListResponse, HarnessPublishAppRequest, HarnessPublishRecipeRequest,
    HarnessPublishResponse, HarnessUnpublishRequest,
};

use super::AcpConnection;
use crate::goose_apps::cache::McpAppCache;
use crate::harness::{self, HarnessClient, PublishPayload};
use crate::recipe::manifest::load_recipe_by_id;

fn harness_error(error: anyhow::Error) -> Error {
    Error::internal_error().data(error.to_string())
}

fn kind_segment(kind: HarnessKindDto) -> &'static str {
    kind.as_path_segment()
}

impl AcpConnection {
    pub(super) async fn on_harness_publish_recipe(
        &self,
        req: HarnessPublishRecipeRequest,
    ) -> Result<HarnessPublishResponse, Error> {
        let recipe = load_recipe_by_id(&req.recipe_id)
            .map_err(|e| Error::invalid_params().data(format!("Recipe not found: {e}")))?;
        if recipe.check_for_security_warnings() {
            return Err(Error::invalid_params()
                .data("This recipe contains hidden characters that could be malicious."));
        }
        let yaml = recipe.to_yaml().map_err(harness_error)?;
        let activities = recipe.activities.unwrap_or_default();
        let client = HarnessClient::from_config().map_err(harness_error)?;
        let result = client
            .publish(
                harness::KIND_RECIPE,
                &PublishPayload {
                    title: &recipe.title,
                    description: &recipe.description,
                    activities: &activities,
                    payload: &yaml,
                },
            )
            .await
            .map_err(harness_error)?;
        Ok(HarnessPublishResponse {
            item_id: result.id,
            updated: result.updated,
        })
    }

    pub(super) async fn on_harness_publish_app(
        &self,
        req: HarnessPublishAppRequest,
    ) -> Result<HarnessPublishResponse, Error> {
        let cache = McpAppCache::new().map_err(|e| {
            Error::internal_error().data(format!("Failed to access app cache: {e}"))
        })?;
        let apps = cache
            .list_apps()
            .map_err(|e| Error::internal_error().data(format!("Failed to list apps: {e}")))?;
        let app = apps
            .into_iter()
            .find(|app| app.resource.name == req.app_name)
            .ok_or_else(|| {
                Error::invalid_params().data(format!("App '{}' not found", req.app_name))
            })?;
        let html = app
            .to_html()
            .map_err(|e| Error::invalid_params().data(format!("Failed to export app: {e}")))?;
        let title = app.resource.name.clone();
        let description = app.resource.description.clone().unwrap_or_default();
        let client = HarnessClient::from_config().map_err(harness_error)?;
        let result = client
            .publish(
                harness::KIND_APP,
                &PublishPayload {
                    title: &title,
                    description: &description,
                    activities: &[],
                    payload: &html,
                },
            )
            .await
            .map_err(harness_error)?;
        Ok(HarnessPublishResponse {
            item_id: result.id,
            updated: result.updated,
        })
    }

    pub(super) async fn on_harness_list(
        &self,
        req: HarnessListRequest,
    ) -> Result<HarnessListResponse, Error> {
        let client = HarnessClient::from_config().map_err(harness_error)?;
        let items = client
            .list(kind_segment(req.kind))
            .await
            .map_err(harness_error)?
            .into_iter()
            .map(|item| HarnessListItemDto {
                id: item.id,
                title: item.title,
                description: item.description,
                activities: item.activities,
                author: item.author,
                updated_at: item.updated_at,
                install_count: item.install_count,
                mine: item.mine,
            })
            .collect();
        Ok(HarnessListResponse { items })
    }

    pub(super) async fn on_harness_fetch(
        &self,
        req: HarnessFetchRequest,
    ) -> Result<HarnessFetchResponse, Error> {
        let client = HarnessClient::from_config().map_err(harness_error)?;
        let item = client
            .fetch(kind_segment(req.kind), req.item_id)
            .await
            .map_err(harness_error)?;
        Ok(HarnessFetchResponse {
            title: item.title,
            description: item.description,
            author: item.author,
            payload: item.payload,
        })
    }

    pub(super) async fn on_harness_unpublish(
        &self,
        req: HarnessUnpublishRequest,
    ) -> Result<EmptyResponse, Error> {
        let client = HarnessClient::from_config().map_err(harness_error)?;
        client
            .unpublish(kind_segment(req.kind), req.item_id)
            .await
            .map_err(harness_error)?;
        Ok(EmptyResponse {})
    }
}
