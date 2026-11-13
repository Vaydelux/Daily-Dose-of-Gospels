import "server-only";
import { parableOfDay } from "@/lib/parables-bank";

/**
 * Verse of the Day + Parable of the Day — 100% Scripture, zero AI.
 *
 * Theology guardrail (user-corrected): we do NOT invent parables, stories, or
 * "scripture-like" content. The Parable of the Day rotates deterministically
 * through a curated bank of real Bible parables (src/lib/parables-bank.ts,
 * verbatim World English Bible text). The Verse of the Day rotates through a
 * hand-curated list of real verses; the short reflection is plainly our own
 * commentary that points back to the text — never presented as Scripture.
 *
 * No database, no cron, no generation step: deterministic rotation by UTC date.
 */

export type DailyPayload = {
  date: string;
  verseText: string;
  verseRef: string;
  reflection: string;
  parableTitle: string;
  parableRef: string;
  parableBody: string;
  parableTake: string;
  parableTakeRef: string;
  parableNote: string;
  parableThemes: string[];
  translation: string;
  source: "scripture";
};

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Curated Verse of the Day (real verses, short reflections) ────────────────
// Every reference is real Scripture in well-known wording, hand-picked for
// certainty. Reflections are human commentary — they explain the verse and end
// pointing to Christ; they never add "new revelation".

type DailyVerse = { verseText: string; verseRef: string; reflection: string };

const DAILY_VERSES: DailyVerse[] = [
  {
    verseText: "Come to me, all you who are weary and burdened, and I will give you rest.",
    verseRef: "Matthew 11:28",
    reflection:
      "Weariness is not a sign of weak faith — even the strongest walkers need somewhere to sit. Jesus does not ask you to tidy yourself up before coming; He simply says come. Whatever weight you carried into today, set it down at His feet for a moment. Rest is not earned; it is received from the One who holds tomorrow.",
  },
  {
    verseText:
      "The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
    verseRef: "Psalm 23:1-3",
    reflection:
      "Sheep do not graze well when they are afraid; a good shepherd leads them to still water on purpose. If your soul feels trampled lately, hear this: God is not driving you, He is leading you. Let Him slow your pace today. Refreshment rarely arrives in the rush — it waits beside the quiet waters where He is already standing.",
  },
  {
    verseText:
      "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    verseRef: "Romans 8:28",
    reflection:
      "This verse does not say all things are good — some things are simply hard. It says God is weaving even the hard threads into something good for those who love Him. The tapestry is not finished, and you are seeing it from the back, where knots and tangles show. Trust the Weaver. One day you will see the side He has been working on all along.",
  },
  {
    verseText:
      "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.",
    verseRef: "John 14:27",
    reflection:
      "The world's peace depends on circumstances behaving; Christ's peace holds while everything shakes. It is not the absence of storms but a stillness inside them — a gift, not a performance. If your heart is troubled today, you do not need to manufacture calm. You only need to receive what the Savior is already holding out to you.",
  },
  {
    verseText: "Cast all your anxiety on him because he cares for you.",
    verseRef: "1 Peter 5:7",
    reflection:
      "Notice the verb: cast — a single, deliberate throw, not a slow leak of worry. God invites you to hand over the whole bundle at once, not because your problems are small, but because His care is personal: He cares for you. Whatever keeps tightening your chest tonight can be thrown onto shoulders wide enough to carry it.",
  },
  {
    verseText:
      "Because of the LORD's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
    verseRef: "Lamentations 3:22-23",
    reflection:
      "There are mornings when strength is gone before the day begins — and these words were written for exactly those mornings. God's love is not a reward for your stamina; it is new when you are empty. Whatever yesterday spent, mercy is already waiting at today's door. Great is His faithfulness, and it points you to the Savior whose compassions carried the cross.",
  },
  {
    verseText:
      "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    verseRef: "Isaiah 40:31",
    reflection:
      "Notice the order: soar, run, walk. Most days are not soaring days; many are barely walking days. The promise is not that the pace never drops — it is that the LORD renews strength at every pace. Hope in Him is not a feeling you muster; it is weight you hand over. And the One who bore the cross can bear your Tuesday.",
  },
  {
    verseText: "The LORD is close to the brokenhearted and saves those who are crushed in spirit.",
    verseRef: "Psalm 34:18",
    reflection:
      "If your heart is broken today, you are not far from God — you are precisely where He has promised to be near. He does not stand at a distance and pity the crushed; He draws close. Bring Him the pieces without editing them first. The Savior who wept at a tomb knows what to do with sorrow.",
  },
  {
    verseText:
      "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.",
    verseRef: "Joshua 1:9",
    reflection:
      "Courage here is not the absence of fear; it is obedience taken while the hands still shake. And notice the reason given: not your talent, not your track record — His presence. Wherever you go today, you do not go alone. That is the whole logic of Christian bravery.",
  },
  {
    verseText:
      "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
    verseRef: "Philippians 4:6-7",
    reflection:
      "Anxiety loses its grip not by thinking less but by praying more. 'Present your requests' is a transfer, not a performance: name the worry to your Father, thank Him for what He has already carried you through, and let His peace stand guard where worry used to sit. The guard is Christ Jesus Himself.",
  },
  {
    verseText: "We have this hope as an anchor for the soul, firm and secure.",
    verseRef: "Hebrews 6:19",
    reflection:
      "An anchor is not useful because it removes the storm; it is useful because it holds the boat while the storm does its worst. Your feelings will toss. The anchor does not move. This hope is fastened to Jesus — who has already gone ahead of you, behind the curtain, into the presence of God.",
  },
  {
    verseText:
      "I lift up my eyes to the mountains — where does my help come from? My help comes from the LORD, the Maker of heaven and earth.",
    verseRef: "Psalm 121:1-2",
    reflection:
      "The psalmist looks at the heights — the hard, high road ahead — and asks the honest question: where will help come from? Not from the hills, not from within, but from the LORD who made both the mountains and you. Look up before you look at the road. Help has a name.",
  },
  {
    verseText:
      "But seek first his kingdom and his righteousness, and all these things will be given to you as well. Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.",
    verseRef: "Matthew 6:33-34",
    reflection:
      "Jesus does not scold you for needing things; He reorders where you look first. Tomorrow is real, but it is not your load — it is His. Seek His kingdom in today's small obediences, and let the Maker of tomorrow carry tomorrow. Bread comes, day by day, to those who ask.",
  },
  {
    verseText:
      "The LORD your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.",
    verseRef: "Zephaniah 3:17",
    reflection:
      "It is one of the most astonishing sentences in Scripture: God not only saves you — He delights in you, and sings over you. If you have only imagined Him disappointed, hear this again. His strength is not aimed at you; it is for you. Let the Mighty Warrior be your song today.",
  },
  {
    verseText:
      "God is our refuge and strength, an ever-present help in trouble. Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea.",
    verseRef: "Psalm 46:1-2",
    reflection:
      "The psalm does not promise that the ground never moves; it promises that God does not. He is 'ever-present' — already on the scene before the trouble finished arriving. When everything shakes, you are allowed to hold onto the One who cannot. Refuge is not a place you build; it is a Person you run to.",
  },
];

// ─── Deterministic daily rotation ─────────────────────────────────────────────

function dayIndex(dateKey: string): number {
  const days = Math.floor(
    (new Date(`${dateKey}T00:00:00Z`).getTime() - new Date("2024-01-01T00:00:00Z").getTime()) /
      86400000
  );
  return Math.abs(days);
}

/** Pure function — same UTC date, same verse and parable, for every visitor. */
export function getDailyContent(dateKey = todayKey()): DailyPayload {
  const verse = DAILY_VERSES[dayIndex(dateKey) % DAILY_VERSES.length];
  const parable = parableOfDay(dateKey);

  return {
    date: dateKey,
    verseText: verse.verseText,
    verseRef: verse.verseRef,
    reflection: verse.reflection,
    parableTitle: parable.title,
    parableRef: parable.ref,
    parableBody: parable.text,
    parableTake: parable.take,
    parableTakeRef: parable.keyRef,
    parableNote: parable.note,
    parableThemes: parable.themes,
    translation: parable.translation,
    source: "scripture",
  };
}

/** How many days each rotation cycle lasts (for the admin dashboard). */
export const DAILY_CYCLE = { verses: DAILY_VERSES.length, parables: 35 };
