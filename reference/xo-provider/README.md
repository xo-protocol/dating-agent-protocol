# XO — DAP Reference Provider

XO is the first platform to implement the Dating Agent Protocol. This directory documents how XO maps its existing infrastructure to DAP.

## DAP Coverage

| DAP Spec | XO Status | Notes |
|----------|-----------|-------|
| DAP-01 Identity | ~90% | SBT + multiple verification methods already operational |
| DAP-02 Discovery | ~80% | ML-based matching engine already operational |
| DAP-03 Connection Flow | New | Consent state machine and warmth tracking are new work |
| DAP-04 Preference Exchange | ~70% | Interest tag matching already operational |
| DAP-05 Reputation | ~90% | Behavioral reputation system already operational |
| DAP-06 Trust & Safety | ~50% | Fraud detection operational; safety signals endpoint is new |
| DAP-07 Conversation Aid | ~40% | ML conversation tools operational; DAP endpoints are new |

## What XO Brings to DAP

XO has production-validated systems for each DAP layer:

- **Identity**: Multi-method verification including biometric liveness and on-chain SBT
- **Discovery**: ML-based recommendation engine with vectorized interest matching
- **Reputation**: Behavioral scoring with anti-gaming mechanics and tiered league system
- **Conversation Intelligence**: Multi-stage pipeline for conversation quality analysis and assistance
- **Trust & Safety**: Multi-layer fraud detection (real-time, batch, daily scan)

## Implementation Plan

### Phase 1: Adapt Existing Endpoints (1 week)
- Map existing API surface to DAP endpoint naming
- Add DAP schema fields to all responses
- Serve Provider Card at `/.well-known/dap-provider.json`
- Map internal reputation tiers to DAP standard tiers

### Phase 2: Consent Engine (2-3 weeks)
- Build warmth computation with DAP mandatory signals
- Implement disclosure class system (5 classes)
- Gate lifecycle (connection request, identity-lite, open contact)
- Warmth reports with mandatory + standard + extension signals

### Phase 3: Complete DAP Coverage (2 weeks)
- Safety signals endpoint
- Incident reporting
- Conversation aid endpoints (break ice, wingman)
- Agent verification

## For Other Providers

If you're implementing DAP for your platform, XO's mapping can serve as a reference for:
- How to map internal verification methods to DAP verification levels
- How to normalize internal reputation scores to DAP standard tiers
- How to compute warmth from DAP mandatory signals
- How to implement disclosure classes with appropriate consent UX

See the [DAP specs](../../spec/) for the full protocol definition.
