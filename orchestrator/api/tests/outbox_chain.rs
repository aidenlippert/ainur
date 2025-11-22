//! Integration tests for outbox↔chain bridge.
//!
//! These tests require a running dev node on CHAIN_WS_URL and Postgres on DATABASE_URL.

use std::time::Duration;

use reqwest::Client;
use serde_json::json;
use sqlx::{Pool, Postgres, Row};
use tokio::time::sleep;

const WS_ENV: &str = "CHAIN_WS_URL";
const DB_ENV: &str = "DATABASE_URL";

async fn wait_for_outbox(
    db: &Pool<Postgres>,
    corr: &str,
    timeout_ms: u64,
) -> sqlx::Result<Option<(String, Option<i64>, Option<i64>)>> {
    let start = std::time::Instant::now();
    loop {
        if start.elapsed() > Duration::from_millis(timeout_ms) {
            return Ok(None);
        }
        if let Some(row) = sqlx::query(
            "SELECT status, chain_task_id, chain_agent_id FROM outbound_extrinsics WHERE correlation_id = $1",
        )
        .bind(corr)
        .fetch_optional(db)
        .await?
        {
            let status: String = row.get("status");
            let chain_task_id: Option<i64> = row.get("chain_task_id");
            let chain_agent_id: Option<i64> = row.get("chain_agent_id");
            if status == "finalized" {
                return Ok(Some((status, chain_task_id, chain_agent_id)));
            }
        }
        sleep(Duration::from_millis(500)).await;
    }
}

#[tokio::test]
#[ignore = "requires running chain and postgres"]
async fn outbox_create_task_finalizes() -> anyhow::Result<()> {
    let _ws = match std::env::var(WS_ENV) {
        Ok(v) => v,
        Err(_) => {
            eprintln!("skipping: {WS_ENV} not set");
            return Ok(());
        }
    };
    let db_url = match std::env::var(DB_ENV) {
        Ok(v) => v,
        Err(_) => {
            eprintln!("skipping: {DB_ENV} not set");
            return Ok(());
        }
    };
    let db = Pool::<Postgres>::connect(&db_url).await?;

    // enqueue create_task
    let client = Client::new();
    let payload = json!({
        "pallet": "TaskMarket",
        "call": "create_task",
        "payload": {
            "spec_hash": "0x0000000000000000000000000000000000000000000000000000000000000001",
            "budget": 10,
            "deadline": 5,
            "verification_level": "best_effort"
        }
    });
    let resp = client
        .post("http://127.0.0.1:8080/v1/outbox")
        .json(&payload)
        .send()
        .await?;
    assert!(resp.status().is_success());
    let body: serde_json::Value = resp.json().await?;
    let corr = body
        .get("correlation_id")
        .and_then(|v| v.as_str())
        .expect("correlation id")
        .to_string();

    // wait for outbox to finalize
    let status = wait_for_outbox(&db, &corr, 20_000)
        .await?
        .expect("outbox not finalized");
    assert_eq!(status.0, "finalized", "create_task did not finalize");

    // Ensure a task row has a chain_task_id set.
    let task_row = sqlx::query("SELECT id FROM tasks WHERE chain_task_id IS NOT NULL LIMIT 1")
        .fetch_optional(&db)
        .await?;
    assert!(task_row.is_some(), "expected a chain task to be recorded");

    Ok(())
}

#[tokio::test]
#[ignore = "requires running chain and postgres"]
async fn outbox_bid_submit_with_real_ids() -> anyhow::Result<()> {
    let db_url = match std::env::var(DB_ENV) {
        Ok(v) => v,
        Err(_) => {
            eprintln!("skipping: {DB_ENV} not set");
            return Ok(());
        }
    };
    let db = Pool::<Postgres>::connect(&db_url).await?;
    let client = Client::new();

    // 1) Register an agent.
    let agent_corr = {
        let payload = json!({
            "pallet": "AgentRegistry",
            "call": "register_agent",
            "payload": {
                "did": "did:ainur:test-agent",
                "capabilities": [],
                "metadata": "test",
                "verification_level": "best_effort"
            }
        });
        let resp = client
            .post("http://127.0.0.1:8080/v1/outbox")
            .json(&payload)
            .send()
            .await?;
        assert!(resp.status().is_success());
        let body: serde_json::Value = resp.json().await?;
        body.get("correlation_id")
            .and_then(|v| v.as_str())
            .unwrap()
            .to_string()
    };
    let agent_status = wait_for_outbox(&db, &agent_corr, 20_000)
        .await?
        .expect("agent outbox not finalized");
    let chain_agent_id = agent_status
        .2
        .expect("agent registration should surface chain_agent_id");

    // 2) Create a task.
    let task_corr = {
        let payload = json!({
            "pallet": "TaskMarket",
            "call": "create_task",
            "payload": {
                "spec_hash": "0x00000000000000000000000000000000000000000000000000000000000000aa",
                "budget": 10,
                "deadline": 5,
                "verification_level": "best_effort"
            }
        });
        let resp = client
            .post("http://127.0.0.1:8080/v1/outbox")
            .json(&payload)
            .send()
            .await?;
        assert!(resp.status().is_success());
        let body: serde_json::Value = resp.json().await?;
        body.get("correlation_id")
            .and_then(|v| v.as_str())
            .unwrap()
            .to_string()
    };
    let task_status = wait_for_outbox(&db, &task_corr, 20_000)
        .await?
        .expect("task outbox not finalized");
    let chain_task_id = task_status
        .1
        .expect("create_task should surface chain_task_id");

    // 3) Submit a bid using the real chain ids.
    let bid_corr = {
        let payload = json!({
            "pallet": "TaskMarket",
            "call": "submit_bid",
            "payload": {
                "task_id": chain_task_id,
                "agent_id": chain_agent_id,
                "commitment": "0x00000000000000000000000000000000000000000000000000000000000000bb",
                "estimated_duration": 5
            }
        });
        let resp = client
            .post("http://127.0.0.1:8080/v1/outbox")
            .json(&payload)
            .send()
            .await?;
        assert!(resp.status().is_success());
        let body: serde_json::Value = resp.json().await?;
        body.get("correlation_id")
            .and_then(|v| v.as_str())
            .unwrap()
            .to_string()
    };

    let bid_status = wait_for_outbox(&db, &bid_corr, 20_000)
        .await?
        .expect("bid outbox not finalized");
    assert_eq!(bid_status.0, "finalized");

    // Confirm a bid exists for the chain task id.
    let bid_row = sqlx::query(
        "SELECT id FROM bids WHERE task_id IN (SELECT id FROM tasks WHERE chain_task_id = $1)",
    )
    .bind(chain_task_id)
    .fetch_optional(&db)
    .await?;
    assert!(bid_row.is_some(), "expected a bid row for the task");

    Ok(())
}
