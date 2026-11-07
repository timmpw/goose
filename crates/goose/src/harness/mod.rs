use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use url::Url;

use crate::config::declarative_providers;
use crate::config::Config;

const TENROUTER_PROVIDER_ID: &str = "tenrouter";
const TENROUTER_API_KEY_SECRET: &str = "TENROUTER_API_KEY";
const HARNESS_BASE_URL_CONFIG_KEY: &str = "GOOSE_HARNESS_BASE_URL";

pub const KIND_RECIPE: &str = "recipes";
pub const KIND_APP: &str = "apps";

/// The publish request body the harness API takes.
#[derive(Serialize)]
pub struct PublishPayload<'a> {
    pub title: &'a str,
    pub description: &'a str,
    pub activities: &'a [String],
    pub payload: &'a str,
}

#[derive(Deserialize)]
pub struct PublishResult {
    pub id: i64,
    pub updated: bool,
}

/// One item of the library listing.
#[derive(Clone, Debug, Deserialize)]
pub struct HarnessItemSummary {
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

/// A fetched item, payload included.
#[derive(Deserialize)]
pub struct HarnessItem {
    pub id: i64,
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub author: String,
    pub payload: String,
}

/// Client of the 10router harness API. The API key never leaves this crate:
/// the desktop talks to it through ACP, the key stays in the secret store.
pub struct HarnessClient {
    base_url: Url,
    api_key: String,
    http: reqwest::Client,
}

impl HarnessClient {
    pub fn from_config() -> Result<Self> {
        let api_key = Config::global()
            .get_secret::<String>(TENROUTER_API_KEY_SECRET)
            .map_err(|_| anyhow!("No 10router key saved. Sign in with your 10r_ key first."))?;
        let base = Config::global()
            .get_param::<String>(HARNESS_BASE_URL_CONFIG_KEY)
            .ok()
            .or_else(|| {
                declarative_providers::load_provider(TENROUTER_PROVIDER_ID)
                    .ok()
                    .map(|provider| provider.config.base_url)
            })
            .unwrap_or_else(|| "https://10r.sokolov.io".to_string());
        let base_url = Url::parse(base.trim_end_matches('/'))
            .with_context(|| format!("Invalid 10router base URL: {base}"))?;
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .context("Failed to build HTTP client")?;
        Ok(Self {
            base_url,
            api_key,
            http,
        })
    }

    fn url(&self, path: &str) -> Url {
        self.base_url.join(path).expect("valid harness URL")
    }

    pub async fn publish(&self, kind: &str, payload: &PublishPayload<'_>) -> Result<PublishResult> {
        let response = self
            .http
            .post(self.url(&format!("/harness/v1/{kind}")))
            .bearer_auth(&self.api_key)
            .json(payload)
            .send()
            .await
            .context("Failed to reach 10router")?;
        Self::parse(response, "publish").await
    }

    pub async fn list(&self, kind: &str) -> Result<Vec<HarnessItemSummary>> {
        let response = self
            .http
            .get(self.url(&format!("/harness/v1/{kind}")))
            .bearer_auth(&self.api_key)
            .send()
            .await
            .context("Failed to reach 10router")?;
        #[derive(Deserialize)]
        struct ListBody {
            items: Vec<HarnessItemSummary>,
        }
        let body: ListBody = Self::parse(response, "list").await?;
        Ok(body.items)
    }

    pub async fn fetch(&self, kind: &str, id: i64) -> Result<HarnessItem> {
        let response = self
            .http
            .get(self.url(&format!("/harness/v1/{kind}/{id}")))
            .bearer_auth(&self.api_key)
            .send()
            .await
            .context("Failed to reach 10router")?;
        Self::parse(response, "fetch").await
    }

    pub async fn unpublish(&self, kind: &str, id: i64) -> Result<()> {
        let response = self
            .http
            .delete(self.url(&format!("/harness/v1/{kind}/{id}")))
            .bearer_auth(&self.api_key)
            .send()
            .await
            .context("Failed to reach 10router")?;
        Self::parse::<serde_json::Value>(response, "unpublish").await?;
        Ok(())
    }

    async fn parse<T: for<'de> Deserialize<'de>>(
        response: reqwest::Response,
        what: &str,
    ) -> Result<T> {
        let status = response.status();
        if status.is_success() {
            return response
                .json()
                .await
                .with_context(|| format!("Malformed 10router response ({what})"));
        }
        #[derive(Deserialize, Default)]
        struct ErrorBody {
            #[serde(default)]
            error: String,
        }
        let message = response
            .json::<ErrorBody>()
            .await
            .map(|body| body.error)
            .unwrap_or_default();
        let message = if message.is_empty() {
            status.to_string()
        } else {
            message
        };
        match status.as_u16() {
            401 => Err(anyhow!("10router did not accept the key: {message}")),
            403 => Err(anyhow!("10router refused: {message}")),
            413 => Err(anyhow!("10router says the item is too large: {message}")),
            _ => Err(anyhow!("10router {what} failed: {message}")),
        }
    }
}
