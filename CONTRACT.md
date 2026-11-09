# Poker hand ranking component

## Purpose and facilities
Takes five to seven cards and returns the best five-card hand: its category, the ranks that decide it (combination ranks then kickers), a single score that orders all hands, and its English name. Also compares two hands and says how the difference was decided (category, combination or kicker, and how many kickers were read), finds the winners among contenders sharing a board (several on a tie, suits never break a tie), and rebuilds the five cards used. It reads card codes through a small card-codes object; the standard fifty-two card codes are built in and a connected card-deck may supply its own.

Facilities: `hand-ranking` (Evaluate, compare and name poker hands).

## User inputs
No installer settings.

## Artefacts and dependencies
`component.json` maps every `implementation/` source into `components/poker-hand-ranking/`:

- `implementation/server/codes.ts` -> `components/poker-hand-ranking/server/codes.ts`
- `implementation/server/index.ts` -> `components/poker-hand-ranking/server/index.ts`
- `implementation/server/ranking.ts` -> `components/poker-hand-ranking/server/ranking.ts`

Dependencies: none.
`tools.lock.json` pins verification tools: node 26.5.0. Licence wording remains deferred.

## Provided interfaces
- `interfaces/hand-ranking.json` defines `hand-ranking` (ae/hand-ranking) version 1.0.0.

## Required interfaces
- `card-deck` (ae/card-deck) version 1.0.0, supplied by the recipe or application.

## Integration
Create one ranking with `createHandRanking()` (or `createHandRanking(codes)` with the card-deck's codes) and pass it to poker-odds, poker-strategy and holdem-rules, which take it as the hand-ranking interface. It is a pure library: no state, no timers, no randomness. TypeScript on the server and any web or desktop consumer that bundles it; the Swift and Kotlin apps never rank hands themselves (they show the names the server sends), so there is no Apple or Android code.

## Visual definition and connected examples
`visual/definition.json` maps its ports to the provided and required interfaces. `visual/examples/connected.json` connects the component to an illustrative application consumer. Both image formats and a text description are retained under `visual/output/`.

## Infrastructure
No deployed service, account or key. Pure functions over card codes.

## Verification
`node --test tests/server.test.ts` checks named fixture hands for every category (royal flush, wheel, steel wheel, full house from two trips, three pairs, flush under a straight, ace-high), the ordering of scores, kicker and combination reporting, ties and winners, best-five reconstruction, refusal of bad input, and agreement with an independent brute-force reference (every five-card subset of seven) on 3000 seeded hand pairs. The extraction was also compared with the recipe's evaluate.ts on 20000 random five, six and seven card hands: score, ranks and name identical.

- `node --test tests/server.test.ts` (web, required-local; tools: node 26.5.0)

## Scenarios and presentation
A table shows each player's hand name at showdown. A teaching screen compares two hands and says a kicker decided it. A computer player scores a candidate hand. A rules component asks for the winners of each pot.

## Updates and removal
Removing the component removes the files under components/poker-hand-ranking/; nothing is stored.
