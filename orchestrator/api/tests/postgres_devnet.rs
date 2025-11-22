#![cfg(feature = "postgres")]

use std::env;

use ainur_orchestrator_api::model::{
    AgentRegistrationRequest, BidSubmissionRequest, ResultSubmissionRequest, StoredBid,
    StoredResult, StoredTask, TaskSubmissionRequest,
};
use ainur_orchestrator_api::storage::PostgresStorage;
use ainur_orchestrator_api::storage::Storage;
use base64::{engine::general_purpose, Engine as _};

fn db_url() -> Option<String> {
    env::var("DATABASE_URL").ok()
}

#[tokio::test]
#[ignore = "requires local Postgres (DATABASE_URL) and optional chain devnet"]
async fn postgres_storage_roundtrip() {
    let Some(url) = db_url() else {
        eprintln!("DATABASE_URL not set; skipping integration test");
        return;
    };

    let storage = PostgresStorage::connect_with_pool(&url, 4, 5)
        .await
        .expect("connect pg");

    let agent = AgentRegistrationRequest {
        id: "agent-1".into(),
        label: "integration-agent".into(),
    };
    storage.register_agent(agent.clone()).await.unwrap();
    let fetched_agent = storage.get_agent("agent-1").await.unwrap();
    assert_eq!(fetched_agent.id, agent.id);

    let task_submission = TaskSubmissionRequest {
        client_task_id: Some("client-123".into()),
        requester_id: "requester-xyz".into(),
        description: "echo this payload".into(),
        task_type: "echo".into(),
        input_base64: general_purpose::STANDARD.encode(r#"{"msg":"hi"}"#),
        max_budget: 10,
        deadline: 1_700_000_000,
    };

    let stored_task = StoredTask::from_submission(task_submission).unwrap();
    let task_id = stored_task.id.clone();
    storage.insert_task(stored_task.clone()).await.unwrap();

    let fetched_task = storage.get_task(&task_id).await.unwrap();
    assert_eq!(fetched_task.id, task_id);

    let bid_submission = BidSubmissionRequest {
        task_id: task_id.clone(),
        agent_id: agent.id.clone(),
        value: 5,
        quality_score: 90,
        completion_time: 10,
    };

    let stored_bid = StoredBid::from_submission(bid_submission, &stored_task).unwrap();
    storage.insert_bid(stored_bid.clone()).await.unwrap();
    let bids = storage.get_bids_for_task(&task_id).await.unwrap();
    assert_eq!(bids.len(), 1);

    let result_submission = ResultSubmissionRequest {
        task_id: task_id.clone(),
        agent_id: agent.id.clone(),
        output_base64: general_purpose::STANDARD.encode(r#"{"msg":"hi","echo":true}"#),
    };

    let stored_result =
        StoredResult::from_submission(result_submission, &stored_task.clone()).unwrap();
    storage.insert_result(stored_result.clone()).await.unwrap();

    let fetched_result = storage.get_result_for_task(&task_id).await.unwrap();
    assert_eq!(fetched_result.id, stored_result.id);
}
