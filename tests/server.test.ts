import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHandRanking, handRanking, standardCodes, CATEGORY } from "../implementation/server/index.ts";
import { oracleCompare, seededRandom } from "./support/oracle.ts";
import { winnersOf, strongestAt } from "../examples/consumer.ts";

const hands: { cards: string; category: string; ranks: number[]; name: string }[] = JSON.parse(readFileSync(new URL("fixtures/hands.json", import.meta.url), "utf8"));
const split = (s: string) => s.split(" ");
const ev = (s: string) => handRanking.evaluate(split(s));

test("fixture hands name their category, deciding ranks and English name", () => {
  for (const h of hands) {
    const e = ev(h.cards);
    assert.equal(e.category, h.category, h.cards);
    assert.deepEqual(e.ranks, h.ranks, h.cards);
    assert.equal(e.name, h.name, h.cards);
  }
});

test("scores rise with category and with every deciding rank", () => {
  const ladder = ["Ac Jd 9h 7s 3c", "8c 8d Ah Ks 3c", "Jc Jd 4h 4s Ac", "Qc Qd Qh 9s 4c", "9c 8d 7h 6s 5c", "Ac 9c 7c 4c 2c", "Kc Kd Kh 4s 4d", "7c 7d 7h 7s Ac", "9h 8h 7h 6h 5h"];
  const scores = ladder.map((s) => handRanking.evaluate(split(s)).score);
  assert.deepEqual([...scores].sort((a, b) => a - b), scores);
  assert.equal(new Set(scores).size, scores.length);
  assert.deepEqual(ladder.map((s) => handRanking.evaluate(split(s)).category), [...CATEGORY]);
});

test("the wheel is the lowest straight and loses to a six-high straight", () => {
  assert.ok(handRanking.compare(split("2c 3d 4h 5s 6c"), split("Ac 2d 3h 4s 5c")) > 0);
  assert.ok(handRanking.compare(split("Ac 2d 3h 4s 5c"), split("Ac Ad 3h 4s 5c")) > 0);
});

test("seven cards: three pairs use the best two and the best remaining kicker", () => {
  const e = ev("Kc Kd 9h 9s 4c 4d Ah");
  assert.equal(e.category, "twoPair");
  assert.deepEqual(e.ranks, [11, 7, 12]);
});

test("seven cards: a flush beats a straight on the same cards and a straight flush beats both", () => {
  assert.equal(ev("9h 8h 7h 6h 2h 5c Kd").category, "flush");
  assert.equal(ev("9h 8h 7h 6h 5h 5c Kd").category, "straightFlush");
  assert.equal(ev("9h 8h 7h 6c 5c Td Kd").category, "straight");
});

test("seven cards: a straight flush is found under a higher unsuited straight", () => {
  const e = ev("9h 8h 7h 6h 5h Tc Jd");
  assert.equal(e.category, "straightFlush");
  assert.deepEqual(e.ranks, [7]);
});

test("kickers decide and are reported", () => {
  const a = handRanking.evaluate(split("Ac Ad Kh 7s 3c 2d 9h"));
  const b = handRanking.evaluate(split("As Ah Kd 7d 3d 2c 8h"));
  const cmp = handRanking.compareEvaluations(a, b);
  assert.deepEqual(cmp, { result: 1, decidedBy: "kicker", kickersRead: 2 });
  assert.deepEqual(handRanking.kickers(a), [11, 7, 5]);
  assert.deepEqual(handRanking.compareEvaluations(b, a), { result: -1, decidedBy: "kicker", kickersRead: 2 });
  const topKicker = handRanking.compareEvaluations(handRanking.evaluate(split("Ac Ad Qh 7s 3c")), handRanking.evaluate(split("As Ah Jd 7d 3d")));
  assert.deepEqual(topKicker, { result: 1, decidedBy: "kicker", kickersRead: 1 });
});

test("combination and category differences are named", () => {
  const e = (s: string) => handRanking.evaluate(split(s));
  assert.equal(handRanking.compareEvaluations(e("Kc Kd 2h 4s 7c"), e("Qc Qd 2h 4s 7c")).decidedBy, "combination");
  assert.equal(handRanking.compareEvaluations(e("Kc Kd 2h 4s 7c"), e("Ac Jd 2h 4s 7c")).decidedBy, "category");
  assert.equal(handRanking.compareEvaluations(e("Ac 9c 7c 4c 2c"), e("Ad 9d 7d 4d 3d")).decidedBy, "combination");
});

test("ties: the board plays, and suits never break a tie", () => {
  const board = split("Ac Kd Qh Js Tc");
  const r = handRanking.winners([{ id: "a", cards: split("2c 3d") }, { id: "b", cards: split("2h 3s") }, { id: "c", cards: split("9c 9d") }], board);
  assert.deepEqual(r.ids, ["a", "b", "c"]);
  assert.equal(handRanking.compare(split("Ac Kd Qh Js 9c"), split("As Kh Qd Jc 9d")), 0);
});

test("winners picks the strict best, in contender order, with every evaluation", () => {
  const board = split("2c 7d Th Js 4c");
  const r = handRanking.winners([{ id: "x", cards: split("Ac Ad") }, { id: "y", cards: split("Jd Jh") }, { id: "z", cards: split("Kc Kd") }], board);
  assert.deepEqual(r.ids, ["y"]);
  assert.equal(r.evaluations.y.category, "threeOfAKind");
  assert.deepEqual(Object.keys(r.evaluations), ["x", "y", "z"]);
});

test("agrees with a brute-force reference on 3000 seeded seven-card hand pairs", () => {
  const rng = seededRandom(20261109);
  for (let n = 0; n < 3000; n++) {
    const deck = standardCodes.fullDeck();
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const board = deck.slice(0, 5);
    const a = [...deck.slice(5, 7), ...board];
    const b = [...deck.slice(7, 9), ...board];
    assert.equal(Math.sign(handRanking.compare(a, b)), oracleCompare(a, b), `${a} vs ${b}`);
  }
});

test("bestFive returns the five cards the evaluation used", () => {
  const cards = split("Ac Ad Ah Ks Kd 2c 3d");
  const e = handRanking.evaluate(cards);
  assert.deepEqual(handRanking.bestFive(cards, e).sort(), ["Ac", "Ad", "Ah", "Kd", "Ks"].sort());
  const wheel = split("Ac 2d 3h 4s 5c 9d Kh");
  assert.deepEqual(handRanking.bestFive(wheel, handRanking.evaluate(wheel)), ["5c", "4s", "3h", "2d", "Ac"]);
  const flushCards = split("Ac 9c 7c 4c 2c Kc Kd");
  assert.deepEqual(handRanking.bestFive(flushCards, handRanking.evaluate(flushCards)), ["Ac", "Kc", "9c", "7c", "4c"]);
  const pair = split("8c 8d Ah Ks 3c 2d 7h");
  const five = handRanking.bestFive(pair, handRanking.evaluate(pair));
  assert.deepEqual(five, ["8c", "8d", "Ah", "Ks", "7h"]);
  assert.deepEqual(handRanking.patternCards(five, handRanking.evaluate(pair)), ["8c", "8d"]);
});

test("invalid input is refused", () => {
  assert.throws(() => handRanking.evaluate(split("Ac Kd Qh Js")), RangeError);
  assert.throws(() => handRanking.evaluate(split("Ac Kd Qh Js Tc 2d 3d 4d")), RangeError);
  assert.throws(() => handRanking.evaluate(split("Ac Kd Qh Js Xc")), RangeError);
});

test("another card-deck can supply its own names", () => {
  const french = createHandRanking({ ...standardCodes, rankPlurals: standardCodes.rankPlurals.map((p) => `les ${p}`) });
  assert.equal(french.evaluate(split("Kc Kd 2h 4s 7c")).name, "Pair of les kings");
});

test("consumer example: winners and strongest holding without the game", () => {
  assert.deepEqual(winnersOf([{ id: "a", cards: split("Ac Ad") }, { id: "b", cards: split("Kc Kd") }], split("2c 7d Th Js 4c")), ["a"]);
  assert.equal(strongestAt(split("Ac Ad Kc Kd Qs Jh 2d")), "Two pair, aces and kings");
});
