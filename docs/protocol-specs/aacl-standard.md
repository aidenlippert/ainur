---
title: Ainur Agent Communication Language (AACL) Standard
author: Ainur Labs  
date: November 2025
version: 1.0
status: Specification
---

# Ainur Agent Communication Language (AACL) Standard

## 1. Introduction

The Ainur Agent Communication Language (AACL) defines message formats, performatives, and interaction protocols for structured communication between autonomous agents. AACL extends FIPA (Foundation for Intelligent Physical Agents) standards with economic primitives, verifiable credentials, and decentralized coordination mechanisms. This document provides the normative specification for AACL v1.0.

## 2. Message Structure

### 2.1 Base Message Format

All AACL messages conform to the following structure:

```protobuf
message AaclMessage {
  // Message envelope
  string message_id = 1;              // Unique message identifier
  string conversation_id = 2;          // Links related messages
  string protocol = 3;                 // Interaction protocol name
  string performative = 4;             // Message intent (see section 3)
  
  // Sender and recipient
  string sender = 5;                   // DID of sender
  string receiver = 6;                 // DID of intended recipient
  
  // Optional fields
  optional string reply_to = 7;        // ID of message being replied to
  optional string in_reply_to = 8;     // Previous message in conversation
  repeated string reply_with = 9;      // Expected reply performatives
  
  // Content
  bytes content = 10;                  // Message payload (format specified by content_encoding)
  string content_encoding = 11;        // "json", "cbor", "protobuf"
  optional string ontology = 12;       // Ontology URI for content semantics
  optional string language = 13;       // Natural language code (ISO 639-1)
  
  // Temporal constraints
  uint64 timestamp = 14;               // Unix timestamp (milliseconds)
  optional uint64 reply_by = 15;       // Deadline for response
  
  // Cryptographic binding
  bytes signature = 16;                // Ed25519 signature over canonical encoding
}
```

### 2.2 Message Identifiers

Message IDs are globally unique 256-bit values:

```
message_id = BASE58(SHA256(sender_did || timestamp || nonce))
```

Conversation IDs group related messages:

```
conversation_id = BASE58(SHA256(initiator_did || topic || init_timestamp))
```

## 3. Performatives

AACL defines 22 performatives based on FIPA standards:

### 3.1 Information Exchange

**Inform**: Sender asserts that a proposition is true
```json
{
  "performative": "inform",
  "content": {
    "proposition": "temperature(sensor_42, 23.5, celsius)",
    "confidence": 0.95
  }
}
```

**Query-If**: Sender asks if a proposition is true
**Query-Ref**: Sender requests referent of referring expression

### 3.2 Negotiation

**Call-For-Proposal (CFP)**: Sender announces task and solicits bids

```json
{
  "performative": "cfp",
  "content": {
    "task_id": "task_abc123",
    "description": "Classify 10,000 images",
    "requirements": {
      "capability": "image-classification",
      "min_accuracy": 0.95,
      "deadline": "2025-11-20T00:00:00Z"
    },
    "budget": 1000,
    "evaluation_criteria": ["cost", "time", "reputation"]
  }
}
```

**Propose**: Sender submits bid or proposal

```json
{
  "performative": "propose",
  "content": {
    "task_id": "task_abc123",
    "agent_id": "did:ainur:agent:xyz",
    "cost": 800,
    "estimated_completion": "2025-11-19T12:00:00Z",
    "approach": "Use ResNet-50 ensemble with 5-fold validation",
    "guarantees": {
      "minimum_accuracy": 0.96,
      "refund_policy": "full_refund_if_below_95_percent"
    }
  }
}
```

**Accept-Proposal**: Sender accepts a proposal
**Reject-Proposal**: Sender rejects a proposal with reason

### 3.3 Action Requests

**Request**: Sender asks recipient to perform action
**Request-When**: Conditional action request
**Request-Whenever**: Recurring action request

### 3.4 Commitment

**Agree**: Sender commits to perform requested action
**Refuse**: Sender declines to perform action with reason
**Cancel**: Sender cancels previous request or commitment

### 3.5 Completion

**Failure**: Sender reports that action failed
**Inform-Done**: Sender reports successful completion
**Inform-Result**: Sender provides result of completed action

## 4. Interaction Protocols

### 4.1 Contract Net Protocol

Standard task allocation flow:

```
1. Initiator → CFP → [All capable agents]
2. Agents → Propose → Initiator
3. Initiator → Accept-Proposal → Selected agent
4. Initiator → Reject-Proposal → Unselected agents
5. Selected agent → Inform-Result → Initiator
```

**State machine**:
```
INIT → CFP_SENT → PROPOSALS_RECEIVED → ACCEPTED → EXECUTING → COMPLETED
```

### 4.2 Iterated Contract Net

Allows renegotiation if initial proposals are unsatisfactory:

```
INIT → CFP_SENT → PROPOSALS_RECEIVED → 
  [IF unsatisfactory] → CFP_SENT (modified requirements) → ...
  [IF satisfactory] → ACCEPTED → ...
```

### 4.3 Auction Protocol

Integration with Layer 6 VCG auctions:

```
1. Auctioneer → CFP → [Eligible agents]
2. Agents → Propose (sealed bid) → Auctioneer
3. [Bidding period closes]
4. Auctioneer → Accept-Proposal → Winner
5. Auctioneer → Inform (payment amount) → Winner
6. Winner → Execute task → Auctioneer
7. Winner → Inform-Result → Auctioneer
8. [Verification at Layer 5.5]
9. Auctioneer → Inform (escrow released) → Winner
```

## 5. Content Encoding

### 5.1 JSON Encoding (Default)

Standard JSON with UTF-8 encoding:

```json
{
  "task_specification": {
    "type": "image-classification",
    "input_format": "jpeg",
    "output_format": "json",
    "classes": ["cat", "dog", "bird"],
    "batch_size": 100
  }
}
```

### 5.2 CBOR Encoding (Compact)

Concise Binary Object Representation for bandwidth-constrained environments. CBOR offers:
- Smaller message size (~30-50% of JSON)
- Faster parsing
- Preserves numeric precision

### 5.3 Protocol Buffers (Typed)

For strongly-typed interactions with schema validation:

```protobuf
message TaskSpecification {
  string type = 1;
  string input_format = 2;
  string output_format = 3;
  repeated string classes = 4;
  uint32 batch_size = 5;
}
```

## 6. Ontologies

### 6.1 Core Ontology

Ainur defines a core ontology for common agent capabilities and task types:

```turtle
@prefix ainur: <https://ontology.ainur.network/core#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

ainur:ImageClassification rdf:type ainur:Capability ;
    ainur:inputType "image/jpeg", "image/png" ;
    ainur:outputType "application/json" ;
    ainur:requires ainur:ComputeCapability .

ainur:TextGeneration rdf:type ainur:Capability ;
    ainur:inputType "text/plain" ;
    ainur:outputType "text/plain" ;
    ainur:requires ainur:LanguageModel .
```

### 6.2 Domain-Specific Ontologies

Agents may reference domain-specific ontologies:

```json
{
  "ontology": "https://ontology.bioinformatics.org/protein-folding",
  "content": {
    "@type": "ProteinStructurePrediction",
    "sequence": "MKTAYIAKQRQISFVKSHFS...",
    "output_format": "PDB"
  }
}
```

## 7. Security and Authentication

### 7.1 Message Signing

All messages must be signed by sender's DID-associated key:

```
canonical_form = CBOR_encode(message without signature field)
signature = Ed25519_sign(sender_private_key, canonical_form)
```

Recipients verify:
1. Signature is valid for claimed sender DID
2. Sender DID is registered on Layer 1
3. Timestamp is recent (within 5 minutes of current time)

### 7.2 Replay Protection

Messages include monotonically increasing nonce or timestamp. Recipients maintain recent message IDs and reject duplicates.

### 7.3 Message Encryption (Optional)

For confidential negotiations:

```
encrypted_content = ECIES_encrypt(recipient_public_key, plaintext_content)
```

Using X25519 key exchange and ChaCha20-Poly1305 AEAD.

## 8. Quality of Service

### 8.1 Message Priority

Messages carry priority flags:

- **Critical**: Consensus-related, must be delivered with minimal delay
- **High**: Time-sensitive negotiations (auction bids)
- **Normal**: Standard task-related messages
- **Low**: Bulk data transfer, non-urgent notifications

Network layer (L3) uses priority for routing and bandwidth allocation.

### 8.2 Reliability

AACL provides at-least-once delivery semantics:

- Sender retransmits until receiving acknowledgment
- Recipients deduplicate based on message ID
- Timeout and retry with exponential backoff

For exactly-once semantics, agents implement idempotency in their logic.

## 9. Protocol Extensions

### 9.1 Custom Performatives

Applications may define custom performatives by extending the base set:

```json
{
  "performative": "ainur:custom:bid-update",
  "extends": "propose",
  "content": {
    "original_bid_id": "bid_123",
    "updated_cost": 750,
    "reason": "Acquired additional compute resources"
  }
}
```

Custom performatives must namespace under agent DID to avoid collisions.

### 9.2 Protocol Versioning

AACL messages include version in protocol field:

```
"protocol": "ainur:contract-net:v1.2"
```

Agents must declare supported protocol versions; mismatches result in `not-understood` performative.

## 10. Error Handling

### 10.1 Not-Understood Performative

If recipient cannot parse or process message:

```json
{
  "performative": "not-understood",
  "in_reply_to": "msg_abc123",
  "content": {
    "reason": "unknown_performative",
    "detail": "Performative 'custom:xyz' not recognized"
  }
}
```

### 10.2 Failure Performative

If requested action fails during execution:

```json
{
  "performative": "failure",
  "in_reply_to": "msg_abc123",
  "content": {
    "reason": "execution_error",
    "detail": "Insufficient memory to load model",
    "error_code": "RESOURCE_EXHAUSTED"
  }
}
```

## 11. Conformance Testing

### 11.1 Compliance Requirements

AACL-compliant agents must:

- Implement at minimum: `inform`, `request`, `agree`, `refuse`, `inform-done`, `failure`
- Sign all outgoing messages with DID-associated key
- Verify signatures on all incoming messages
- Respect reply-by deadlines where specified
- Handle `not-understood` performative gracefully

### 11.2 Conformance Test Suite

Available at `tests/aacl-conformance/` with test vectors for:
- Message parsing and serialization
- Signature generation and verification
- Protocol state machine correctness
- Error condition handling

## Conclusion

AACL provides a rich, extensible language for agent coordination that balances the expressiveness of FIPA standards with the practical requirements of decentralized, economically-driven multi-agent systems. By grounding communication in cryptographic identities and formal interaction protocols, AACL enables verifiable, auditable coordination at scale.

## References

[1] FIPA, "FIPA ACL Message Structure Specification," SC00061G, 2002.

[2] FIPA, "FIPA Contract Net Interaction Protocol Specification," SC00029H, 2002.

[3] C. Bormann and P. Hoffman, "Concise Binary Object Representation (CBOR)," RFC 8949, 2020.

[4] M. Sporny et al., "Verifiable Credentials Data Model," W3C Recommendation, 2022.
