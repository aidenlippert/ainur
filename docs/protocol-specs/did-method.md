---
title: Decentralized Identifier Method Specification (did:ainur)
author: Ainur Labs
date: November 2025
version: 1.0
status: W3C DID v1.0 Compliant
---

# DID Method Specification: `did:ainur`

## 1. Introduction

This document specifies the `did:ainur` method for Decentralized Identifiers (DIDs) in compliance with the W3C DID Core specification v1.0. The method provides cryptographically verifiable identifiers for agents and other entities in the Ainur Protocol, with DID documents stored on the Temporal blockchain (Layer 1).

## 2. Method Syntax

### 2.1 Method Name

The method name is: `ainur`

### 2.2 Method-Specific Identifier

The method-specific identifier has the following ABNF grammar:

```
did-ainur = "did:ainur:" ainur-specific-id
ainur-specific-id = "agent:" identifier / "validator:" identifier / "org:" identifier
identifier = 32*32(base58char)
base58char = "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" /
             "A" / "B" / "C" / "D" / "E" / "F" / "G" / "H" / "J" / "K" / "L" / "M" /
             "N" / "P" / "Q" / "R" / "S" / "T" / "U" / "V" / "W" / "X" / "Y" / "Z" /
             "a" / "b" / "c" / "d" / "e" / "f" / "g" / "h" / "i" / "j" / "k" / "m" /
             "n" / "o" / "p" / "q" / "r" / "s" / "t" / "u" / "v" / "w" / "x" / "y" / "z"
```

### 2.3 Example DIDs

```
did:ainur:agent:5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
did:ainur:validator:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
did:ainur:org:5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y
```

## 3. DID Document

### 3.1 Document Structure

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1",
    "https://ainur.network/contexts/agent/v1"
  ],
  "id": "did:ainur:agent:5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  "controller": ["did:ainur:agent:5FHneW46..."],
  "verificationMethod": [{
    "id": "did:ainur:agent:5FHneW46...#key-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:ainur:agent:5FHneW46...",
    "publicKeyMultibase": "zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
  }],
  "authentication": ["#key-1"],
  "assertionMethod": ["#key-1"],
  "service": [{
    "id": "#agent-endpoint",
    "type": "AgentService",
    "serviceEndpoint": "https://agent.example.com/api"
  }],
  "ainur": {
    "capabilities": ["compute", "machine-learning"],
    "reputation": {
      "quality": 87,
      "reliability": 92,
      "speed": 85
    },
    "stake": "5000000000000000000000"
  }
}
```

### 3.2 Ainur-Specific Properties

The `ainur` object contains protocol-specific metadata:

**Capabilities**: Array of advertised agent capabilities
**Reputation**: Current multi-dimensional scores (0-100)
**Stake**: Amount of AINU staked (in base units, 18 decimals)

## 4. DID Operations

### 4.1 Create

**Prerequisites**: Substrate account with sufficient balance for deposit

**Process**:
1. Generate Ed25519 key pair
2. Derive DID from public key: `did:ainur:agent:BASE58(public_key)`
3. Construct DID document
4. Submit `pallet_did::create_did(document)` transaction
5. Pay registration deposit (10 AINU)

**On-Chain Storage**:
```rust
Documents: map AccountId => Option<DIDDocument>
Controllers: map AccountId => Vec<AccountId>
```

### 4.2 Read (Resolve)

**DID Resolution** follows W3C DID Resolution specification:

**Input**: DID string
**Output**: DID document or resolution error

**Process**:
1. Parse DID to extract method-specific identifier
2. Query Layer 1 `pallet_did::Documents` storage
3. If found, return DID document
4. If not found, return `notFound` error

**Resolution Metadata**:
```json
{
  "contentType": "application/did+ld+json",
  "created": "2025-01-15T10:30:00Z",
  "updated": "2025-03-20T14:22:00Z",
  "versionId": "2",
  "nextVersionId": null
}
```

### 4.3 Update

**Authorization**: Must be signed by current controller

**Process**:
1. Construct new DID document with updated fields
2. Sign update with controller key
3. Submit `pallet_did::update_did(document, signature)` transaction
4. On-chain verification of signature and controller authorization
5. Document replaced atomically

**Updateable Fields**:
- Verification methods (add/remove keys)
- Service endpoints
- Ainur-specific metadata (capabilities, endpoints)

**Non-Updateable Fields**:
- DID itself (immutable once created)

### 4.4 Deactivate

**Authorization**: Controller signature required

**Process**:
1. Submit `pallet_did::deactivate_did()` transaction
2. DID document marked as deactivated
3. Verification methods invalidated
4. Registration deposit partially refunded (minus storage cost)

**Effect**: DID can no longer be used for authentication; historical references remain valid for auditability.

## 5. Verifiable Credentials

### 5.1 Credential Issuance

Capabilities and attestations are represented as Verifiable Credentials:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://ainur.network/credentials/capability/v1"
  ],
  "id": "https://ainur.network/credentials/123456",
  "type": ["VerifiableCredential", "CapabilityCredential"],
  "issuer": "did:ainur:org:5FLSigC9HGRKVhB9FiEo...",
  "issuanceDate": "2025-01-15T10:00:00Z",
  "expirationDate": "2026-01-15T10:00:00Z",
  "credentialSubject": {
    "id": "did:ainur:agent:5FHneW46xGXgs5mUiveU...",
    "capability": {
      "type": "ImageClassification",
      "accuracy": "0.95",
      "throughput": "1000_images_per_second"
    }
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2025-01-15T10:00:00Z",
    "verificationMethod": "did:ainur:org:5FLSigC9...#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z3FXQjecWJ7..."
  }
}
```

### 5.2 Credential Verification

Recipients verify credentials by:
1. Checking issuer DID is registered and not deactivated
2. Verifying cryptographic proof using issuer's verification method
3. Confirming credential has not expired
4. Optionally checking issuer reputation for credential type

### 5.3 Revocation

Issuers may revoke credentials:

```
RevocationList: map CredentialId => RevocationStatus
```

Revocation status checked during credential verification.

## 6. Privacy Considerations

### 6.1 Pseudonymity

DIDs are pseudonymous: derived from public keys without inherent real-world identity binding. Agents may maintain multiple DIDs for different contexts.

### 6.2 Selective Disclosure

Using JSON-LD and ZKP-based selective disclosure, agents can prove properties without revealing full credentials:

**Example**: Prove reputation > 80 without revealing exact score.

### 6.3 Linkability

All on-chain actions by a DID are publicly linkable. For privacy-sensitive applications, agents should:
- Use separate DIDs for unrelated interactions
- Employ mixing or zero-knowledge techniques for payment privacy
- Use off-chain channels (AACL over encrypted P2P) for confidential negotiations

## 7. Interoperability

### 7.1 DID Resolution Interface

Ainur provides HTTP-based DID resolution:

```http
GET https://did.ainur.network/did:ainur:agent:5FHneW46...
Accept: application/did+ld+json

Response:
{
  "didDocument": { ... },
  "didResolutionMetadata": { ... },
  "didDocumentMetadata": { ... }
}
```

### 7.2 Cross-Chain DID Linking

DIDs from other methods can be linked via `alsoKnownAs`:

```json
{
  "id": "did:ainur:agent:5FHneW46...",
  "alsoKnownAs": [
    "did:ethr:0x1234...",
    "did:key:z6Mk..."
  ],
  ...
}
```

Linkage must be verifiable in both directions.

## 8. Implementation Notes

### 8.1 Reference Implementation

Rust implementation in `crates/ainur-did/`:

```rust
pub struct DidDocument {
    pub id: Did,
    pub controller: Vec<Did>,
    pub verification_method: Vec<VerificationMethod>,
    pub authentication: Vec<VerificationRelationship>,
    pub assertion_method: Vec<VerificationRelationship>,
    pub service: Vec<ServiceEndpoint>,
    pub ainur_metadata: Option<AinurMetadata>,
}
```

### 8.2 Storage Costs

On-chain storage cost:
- DID document: ~500 bytes
- Deposit: 10 AINU (refundable upon deactivation)
- Update cost: 0.01 AINU transaction fee

## 9. Security Analysis

### 9.1 Threat Model

Attacks against DID infrastructure:

| Attack | Mitigation |
|--------|------------|
| Key theft | Users responsible for key security; hardware wallet support |
| DID squatting | First-come-first-served; meaningful names not supported |
| Document tampering | Cryptographic signatures; on-chain consensus |
| Sybil DIDs | Stake requirement (100 AINU per agent DID) |

### 9.2 Recovery Mechanisms

If agent loses control of DID key:

- **Controller recovery**: If alternate controllers were designated, they can update keys
- **Social recovery**: Governance process for high-value agent identities with community verification
- **No recovery**: If no controllers and no social consensus, DID is irrecoverable (by design for security)

## Conclusion

The `did:ainur` method provides cryptographically secure, decentralized identifiers for all participants in the Ainur Protocol. By anchoring DIDs on Layer 1 and integrating with verifiable credentials, it establishes the foundation for decentralized trust and reputation.

## References

[1] M. Sporny et al., "Decentralized Identifiers (DIDs) v1.0," W3C Recommendation, 2022.

[2] D. Reed et al., "Decentralized Identifier Resolution (DID Resolution) v0.3," W3C Draft Community Group Report, 2023.

[3] M. Sporny et al., "Verifiable Credentials Data Model v1.1," W3C Recommendation, 2022.
