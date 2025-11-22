CREATE TABLE IF NOT EXISTS outbound_extrinsics (
    correlation_id TEXT PRIMARY KEY,
    pallet TEXT NOT NULL,
    call TEXT NOT NULL,
    payload TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
