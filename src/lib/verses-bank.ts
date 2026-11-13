/**
 * Curated verse bank — every reference is real Scripture (NIV-style wording),
 * organized by the eight themes from the spec. Shared by /verses (client) and
 * the seed script. No AI involved: these are hand-picked for certainty.
 */

export type Verse = {
  ref: string;
  text: string;
  theme: ThemeKey;
};

export const THEMES = [
  { key: "anxiety", label: "Anxiety", blurb: "When worry won't be quiet" },
  { key: "forgiveness", label: "Forgiveness", blurb: "Letting go, being let go" },
  { key: "hope", label: "Hope", blurb: "Light ahead of the road" },
  { key: "grief", label: "Grief", blurb: "For the heavy, quiet days" },
  { key: "fear", label: "Fear", blurb: "Courage for trembling steps" },
  { key: "purpose", label: "Purpose", blurb: "Why you are here" },
  { key: "finances", label: "Finances", blurb: "Provision and contentment" },
  { key: "relationships", label: "Relationships", blurb: "Loving the people near you" },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];

export const VERSES: Verse[] = [
  // ── Anxiety ──────────────────────────────────────────────────────────────
  { theme: "anxiety", ref: "Philippians 4:6-7", text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus." },
  { theme: "anxiety", ref: "1 Peter 5:7", text: "Cast all your anxiety on him because he cares for you." },
  { theme: "anxiety", ref: "Matthew 6:34", text: "Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own." },
  { theme: "anxiety", ref: "Psalm 94:19", text: "When anxiety was great within me, your consolation brought me joy." },
  { theme: "anxiety", ref: "John 14:27", text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid." },
  { theme: "anxiety", ref: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },

  // ── Forgiveness ──────────────────────────────────────────────────────────
  { theme: "forgiveness", ref: "Colossians 3:13", text: "Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you." },
  { theme: "forgiveness", ref: "Ephesians 4:32", text: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you." },
  { theme: "forgiveness", ref: "Matthew 6:14-15", text: "For if you forgive other people when they sin against you, your heavenly Father will also forgive you. But if you do not forgive others their sins, your Father will not forgive your sins." },
  { theme: "forgiveness", ref: "1 John 1:9", text: "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness." },
  { theme: "forgiveness", ref: "Psalm 103:12", text: "As far as the east is from the west, so far has he removed our transgressions from us." },
  { theme: "forgiveness", ref: "Luke 6:37", text: "Do not judge, and you will not be judged. Do not condemn, and you will not be condemned. Forgive, and you will be forgiven." },

  // ── Hope ─────────────────────────────────────────────────────────────────
  { theme: "hope", ref: "Romans 15:13", text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit." },
  { theme: "hope", ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future." },
  { theme: "hope", ref: "Lamentations 3:22-23", text: "Because of the LORD's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness." },
  { theme: "hope", ref: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
  { theme: "hope", ref: "Isaiah 40:31", text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint." },
  { theme: "hope", ref: "Hebrews 6:19", text: "We have this hope as an anchor for the soul, firm and secure." },

  // ── Grief ────────────────────────────────────────────────────────────────
  { theme: "grief", ref: "Psalm 34:18", text: "The LORD is close to the brokenhearted and saves those who are crushed in spirit." },
  { theme: "grief", ref: "Matthew 5:4", text: "Blessed are those who mourn, for they will be comforted." },
  { theme: "grief", ref: "Revelation 21:4", text: "He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away." },
  { theme: "grief", ref: "John 11:25-26", text: "Jesus said to her, I am the resurrection and the life. The one who believes in me will live, even though they die; and whoever lives by believing in me will never die." },
  { theme: "grief", ref: "Psalm 147:3", text: "He heals the brokenhearted and binds up their wounds." },
  { theme: "grief", ref: "2 Corinthians 1:3-4", text: "Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles." },

  // ── Fear ─────────────────────────────────────────────────────────────────
  { theme: "fear", ref: "Psalm 23:4", text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me." },
  { theme: "fear", ref: "Joshua 1:9", text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go." },
  { theme: "fear", ref: "2 Timothy 1:7", text: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline." },
  { theme: "fear", ref: "Psalm 56:3", text: "When I am afraid, I put my trust in you." },
  { theme: "fear", ref: "Deuteronomy 31:6", text: "Be strong and courageous. Do not be afraid or terrified because of them, for the LORD your God goes with you; he will never leave you nor forsake you." },
  { theme: "fear", ref: "Isaiah 43:1-2", text: "Do not fear, for I have redeemed you; I have summoned you by name; you are mine. When you pass through the waters, I will be with you." },

  // ── Purpose ──────────────────────────────────────────────────────────────
  { theme: "purpose", ref: "Jeremiah 1:5", text: "Before I formed you in the womb I knew you, before you were born I set you apart." },
  { theme: "purpose", ref: "Ephesians 2:10", text: "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do." },
  { theme: "purpose", ref: "Proverbs 16:9", text: "In their hearts humans plan their course, but the LORD establishes their steps." },
  { theme: "purpose", ref: "Psalm 139:13-14", text: "For you created my inmost being; you knit me together in my mother's womb. I praise you because I am fearfully and wonderfully made." },
  { theme: "purpose", ref: "Micah 6:8", text: "He has shown you, O mortal, what is good. And what does the LORD require of you? To act justly and to love mercy and to walk humbly with your God." },
  { theme: "purpose", ref: "Colossians 3:23", text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters." },

  // ── Finances ─────────────────────────────────────────────────────────────
  { theme: "finances", ref: "Philippians 4:19", text: "And my God will meet all your needs according to the riches of his glory in Christ Jesus." },
  { theme: "finances", ref: "Matthew 6:33", text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well." },
  { theme: "finances", ref: "Proverbs 3:9-10", text: "Honor the LORD with your wealth, with the firstfruits of all your crops; then your barns will be filled to overflowing, and your vats will brim over with new wine." },
  { theme: "finances", ref: "Hebrews 13:5", text: "Keep your lives free from the love of money and be content with what you have, because God has said, Never will I leave you; never will I forsake you." },
  { theme: "finances", ref: "2 Corinthians 9:8", text: "And God is able to bless you abundantly, so that in all things at all times, having all that you need, you will abound in every good work." },
  { theme: "finances", ref: "Proverbs 21:5", text: "The plans of the diligent lead to profit as surely as haste leads to poverty." },

  // ── Relationships ────────────────────────────────────────────────────────
  { theme: "relationships", ref: "1 Corinthians 13:4-5", text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs." },
  { theme: "relationships", ref: "Proverbs 17:17", text: "A friend loves at all times, and a brother is born for a time of adversity." },
  { theme: "relationships", ref: "Romans 12:18", text: "If it is possible, as far as it depends on you, live at peace with everyone." },
  { theme: "relationships", ref: "Ecclesiastes 4:9-10", text: "Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up." },
  { theme: "relationships", ref: "James 1:19", text: "My dear brothers and sisters, take note of this: Everyone should be quick to listen, slow to speak and slow to become angry." },
  { theme: "relationships", ref: "Galatians 6:2", text: "Carry each other's burdens, and in this way you will fulfill the law of Christ." },
];
