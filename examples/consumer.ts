// A consumer that needs no game: name the winners of a showdown and describe a holding.
import { handRanking, type Card } from "../implementation/server/index.ts";

export function winnersOf(contenders: { id: string; cards: Card[] }[], board: Card[]): string[] {
  return handRanking.winners(contenders, board).ids;
}

export function strongestAt(cards: Card[]): string {
  return handRanking.evaluate(cards).name;
}
