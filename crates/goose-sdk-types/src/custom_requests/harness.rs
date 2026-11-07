use agent_client_protocol::{JsonRpcRequest, JsonRpcResponse};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use super::EmptyResponse;

/// Which half of the harness library a request is about.
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "lowercase")]
pub enum HarnessKindDto {
    #[default]
    Recipe,
    App,
}

impl HarnessKindDto {
    pub fn as_path_segment(&self) -> &'static str {
        match self {
            HarnessKindDto::Recipe => "recipes",
            HarnessKindDto::App => "apps",
        }
    }
}

/// Publish a local recipe to the 10router harness library.
#[derive(Debug, Default, Clone, Serialize, Deserialize, JsonSchema, JsonRpcRequest)]
#[request(
    method = "_goose/unstable/harness/publish-recipe",
    response = HarnessPublishResponse
)]
pub struct HarnessPublishRecipeRequest {
    /// The local recipe's manifest id (`ListRecipesRequest`).
    pub recipe_id: String,
}

/// Publish a local app (HTML mini-app) to the 10router harness library.
#[derive(Debug, Default, Clone, Serialize, Deserialize, JsonSchema, JsonRpcRequest)]
#[request(
    method = "_goose/unstable/harness/publish-app",
    response = HarnessPublishResponse
)]
pub struct HarnessPublishAppRequest {
    pub app_name: String,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize, JsonSchema, JsonRpcResponse)]
pub struct HarnessPublishResponse {
    pub item_id: i64,
    /// True when an existing publication of the same title was updated
    /// (including one the owner or an admin had hidden), false when this
    /// publish created it.
    pub updated: bool,
}

/// List the harness library — everyone's publications, the viewer's own
/// marked with `mine`.
#[derive(Debug, Default, Clone, Serialize, Deserialize, JsonSchema, JsonRpcRequest)]
#[request(method = "_goose/unstable/harness/list", response = HarnessListResponse)]
pub struct HarnessListRequest {
    pub kind: HarnessKindDto,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize, JsonSchema, JsonRpcResponse)]
pub struct HarnessListResponse {
    pub items: Vec<HarnessListItemDto>,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize, JsonSchema, JsonRpcResponse)]
pub struct HarnessListItemDto {
    pub id: i64,
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub activities: Vec<String>,
    #[serde(default)]
    pub author: String,
    #[serde(default)]
    pub updated_at: String,
    #[serde(default)]
    pub install_count: i64,
    #[serde(default)]
    pub mine: bool,
}

/// Fetch one harness item, payload included. The payload is recipe YAML or
/// app HTML, exactly what `recipes/parse` + `recipes/save` or `apps/import`
/// take locally — installing goes through those, behind their checks.
#[derive(Debug, Default, Clone, Serialize, Deserialize, JsonSchema, JsonRpcRequest)]
#[request(method = "_goose/unstable/harness/fetch", response = HarnessFetchResponse)]
pub struct HarnessFetchRequest {
    pub kind: HarnessKindDto,
    pub item_id: i64,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize, JsonSchema, JsonRpcResponse)]
pub struct HarnessFetchResponse {
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub author: String,
    pub payload: String,
}

/// Take the viewer's own publication out of the library. The server hides
/// the item rather than deleting it.
#[derive(Debug, Default, Clone, Serialize, Deserialize, JsonSchema, JsonRpcRequest)]
#[request(method = "_goose/unstable/harness/unpublish", response = EmptyResponse)]
pub struct HarnessUnpublishRequest {
    pub kind: HarnessKindDto,
    pub item_id: i64,
}
