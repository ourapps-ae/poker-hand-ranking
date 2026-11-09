# Poker hand ranking instructions

## For the agent
Select this component whenever the application needs to decide which poker hand wins or to name a hand. It has no settings. Connect its hand-ranking interface to poker-odds, poker-strategy and holdem-rules. Optionally pass the card-deck's card codes to `createHandRanking`.

- Select package `ourapps-ae/poker-hand-ranking` version `0.3.0`.
- No installer settings.
- Connect the provided `hand-ranking` (ae/hand-ranking 1.0.0) to the consumer that needs it.
- Supply `card-deck` (ae/card-deck 1.0.0) from the component that provides it.
- No accounts or keys are needed.

## For the developer
Nothing to configure and no accounts. Import `handRanking` (standard card codes) or `createHandRanking(codes)` from `server/index.ts`. Cards are two-character codes: rank 2-9 T J Q K A, suit c d h s. Use `evaluate` for one hand, `winners` for a showdown, `compareEvaluations` to explain a result.

## How to check
From the component directory:

- `node --test tests/server.test.ts` (web, required-local; tools: node 26.5.0)
- `python3.12 -B /Users/george/Projects/com/my/tools/check_component.py components/poker-hand-ranking` validates the manifest, sidecars and runs the required-local suite.
