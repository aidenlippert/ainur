-- Harden outbound_extrinsics size and error fields.
ALTER TABLE outbound_extrinsics
    ADD CONSTRAINT outbound_extrinsics_payload_len CHECK (payload IS NULL OR char_length(payload) <= 4096),
    ADD CONSTRAINT outbound_extrinsics_last_error_len CHECK (last_error IS NULL OR char_length(last_error) <= 512);

