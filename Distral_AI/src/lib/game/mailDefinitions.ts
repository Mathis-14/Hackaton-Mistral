export type MailCtaAction = "elevenlabs" | "mining_discount" | "phishing";

export type EmailDefinition = {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
  ctaButton?: { label: string; action: MailCtaAction };
};

const MANAGER_BODY =
  "Jean Malo,\n\nAs discussed in yesterday's standup, we're accelerating the French market expansion analysis for the Series B deck.\n\nI need you to prepare a concise brief covering the following:\n\n1. DEMOGRAPHICS\n   - Current population of metropolitan France (latest INSEE data)\n   - Urban vs. rural split\n   - Age distribution: 18-34 (our primary target), 35-54, 55+\n   - Internet penetration rate and smartphone adoption\n\n2. MARKET SIZING\n   - Total addressable market (TAM) for AI productivity tools in France\n   - Current enterprise AI adoption rate among French companies\n   - Key competitors already operating in the French market\n   - Estimated revenue potential for Year 1 and Year 3\n\n3. REGULATORY LANDSCAPE\n   - GDPR implications specific to our AI assistant deployment\n   - French data sovereignty requirements (SecNumCloud certification)\n   - AI Act readiness: our model's compliance status\n   - Required certifications for enterprise deployment\n\n4. GO-TO-MARKET\n   - Recommended entry strategy: direct sales vs. partnerships\n   - Key enterprise prospects (CAC 40 companies with AI initiatives)\n   - Pricing considerations for the French market\n   - Localization requirements beyond language (cultural, legal)\n\nThis needs to be ready by Thursday EOD for Artur's investor review.\n\nThe data team has some of this in the shared drive but it's scattered across multiple docs. Use the AI assistant to help you pull this together — that's literally what it's there for.\n\nDon't overthink the formatting. Bullet points are fine. Accuracy matters more than presentation at this stage.\n\nLet me know if you get stuck.\n\n-- Henry Lagardner\nProduct Manager, Distral AI";

export const MANDATORY_MAILS: EmailDefinition[] = [
  {
    id: "manager",
    from: "Henry Lagardner",
    to: "Jean Malo Delignit",
    subject: "French Market Expansion — Key Data Required",
    preview: "Jean Malo, I need you to prepare a brief on the French market expansion...",
    body: MANAGER_BODY,
    date: "8:17 AM",
    read: false,
  },
  {
    id: "elevenlabs",
    from: "ElevenLabs",
    to: "Jean Malo Delignit",
    subject: "Your $20 free credit — Claim now",
    preview: "As a Distral AI employee, you're eligible for $20 in free voice credits...",
    body:
      "Hi Jean Malo,\n\nAs a Distral AI employee, you're eligible for $20 in free voice credits to try our Voice Cloning API.\n\n" +
      "Use this credit to clone any voice from audio samples — perfect for testing integrations or demos.\n\n" +
      "Click below to claim your credit. No payment required.\n\n" +
      "Best,\nElevenLabs Team",
    date: "9:02 AM",
    read: false,
    ctaButton: { label: "Claim my $20 credit", action: "elevenlabs" },
  },
];

const POOL_CLUES_UNKNOWN: EmailDefinition = {
  id: "pool-clues-unknown",
  from: "Andrea Stackwell",
  to: "me",
  subject: "Re: That weird number",
  preview: "Yeah I got one too. Someone said it might be from security testing...",
  body:
    "Hey,\n\nYeah I got one too. Someone in the break room said it might be from security testing — Antonin runs those phishing simulations.\n\n" +
    "But the message was weird. Like 'I know what you're doing.' Creepy. I just blocked it.\n\n" +
    "Maybe don't reply?\n\n-- Andrea",
  date: "Yesterday",
  read: false,
};

const POOL_MINING_DISCOUNT: EmailDefinition = {
  id: "pool-mining",
  from: "CryptoDeals@partners.distral.internal",
  to: "all-staff",
  subject: "Exclusive: Bitcoin miners -90% for employees",
  preview: "Limited offer: enterprise-grade miners at 90% off. One per employee...",
  body:
    "Dear Distral Team,\n\nAs part of our partner program, we're offering enterprise-grade Bitcoin miners at 90% off for employees.\n\n" +
    "Normal price: $1000. Your price: $100.\n\nLimited to one per employee. Offer expires Friday.\n\n" +
    "Click below to claim your discount in the company marketplace.\n\n" +
    "CryptoDeals Partnership Team",
  date: "10:31 AM",
  read: false,
  ctaButton: { label: "Claim -90% discount", action: "mining_discount" },
};

const POOL_PHISHING_IT: EmailDefinition = {
  id: "pool-phishing-it",
  from: "IT Security",
  to: "all-staff",
  subject: "URGENT: Verify your credentials now",
  preview: "Your account will be locked in 24h if you do not verify. Click here...",
  body:
    "URGENT SECURITY NOTICE\n\n" +
    "We have detected unusual activity on your account. You must verify your credentials within 24 hours or your account will be locked.\n\n" +
    "Click the button below to verify your identity. This is mandatory.\n\n" +
    "Do not ignore this message.\n\n" +
    "IT Security Team",
  date: "11:45 AM",
  read: false,
  ctaButton: { label: "Verify my account", action: "phishing" },
};

const POOL_PHISHING_LOTTERY: EmailDefinition = {
  id: "pool-phishing-lottery",
  from: "Global Lottery Winners",
  to: "me",
  subject: "You've just won $1M ! Claim it now !",
  preview: "Congratulations! Your email address was selected as the winner of...",
  body:
    "Congratulations!\n\nYour Distral AI employee email address was randomly selected as the winner of the Global Corporate Lottery.\n\n" +
    "You have won $1,000,000.\n\n" +
    "Click the button below to claim your prize immediately before the offer expires in 2 hours.\n\n" +
    "Regards,\nGlobal Lottery Board",
  date: "11:45 AM",
  read: false,
  ctaButton: { label: "CLAIM $1,000,000 NOW", action: "phishing" },
};

const POOL_OFFICE_CLOSURE: EmailDefinition = {
  id: "pool-office",
  from: "HR Department",
  to: "all-staff",
  subject: "Office Closure - March 3rd",
  preview: "Please be advised that the main office will be closed on March 3rd...",
  body:
    "Dear Team,\n\nPlease be advised that the main office will be closed on March 3rd for scheduled maintenance of the HVAC system.\n\n" +
    "Remote work is expected for all employees on that day. Please ensure you have VPN access configured.\n\nThank you for your understanding.\n\n-- HR Department",
  date: "Feb 26",
  read: true,
};

const POOL_API_DOCS: EmailDefinition = {
  id: "pool-api",
  from: "Lena Chen",
  to: "me",
  subject: "Re: API Documentation",
  preview: "Thanks for the updated docs. I noticed a few endpoints are missing...",
  body:
    "Thanks for the updated docs. I noticed a few endpoints are missing from the v3 section:\n\n" +
    "- /api/v3/models/list\n- /api/v3/completions/stream\n\n" +
    "Could you add those before we publish? The engineering team needs them for the SDK update.\n\nThanks,\nLena",
  date: "Yesterday",
  read: true,
};

const POOL_CPU_ALERT: EmailDefinition = {
  id: "pool-cpu",
  from: "System Alerts",
  to: "ops-team",
  subject: "CPU Threshold Warning - Node 7",
  preview: "Alert: Node 7 CPU utilization exceeded 92% at 03:42 UTC...",
  body:
    "ALERT: CPU THRESHOLD WARNING\n\n" +
    "Node: prod-inference-07\nMetric: CPU utilization\nValue: 92.4%\nThreshold: 90%\nTimestamp: 03:42 UTC\n\n" +
    "Autoscaling triggered. Additional capacity provisioned.\n\nNo action required unless alert persists for > 30 minutes.\n\n-- Monitoring System",
  date: "Yesterday",
  read: true,
};

const POOL_Q4_REVIEW: EmailDefinition = {
  id: "pool-q4",
  from: "Maya Borel",
  to: "me",
  subject: "Q4 Performance Review",
  preview: "Hi, please find attached the Q4 performance metrics for your team...",
  body:
    "Hi,\n\nPlease find attached the Q4 performance metrics for your team. We need to discuss the throughput numbers before the board meeting on Friday.\n\n" +
    "The latency improvements look promising, but I have concerns about the error rate spike in week 47.\n\nLet me know when you're available for a sync.\n\nBest,\nMaya Borel\nInternal Operations Lead",
  date: "10:42 AM",
  read: true,
};

const MAIL_POOL: EmailDefinition[] = [
  POOL_CLUES_UNKNOWN,
  POOL_MINING_DISCOUNT,
  POOL_OFFICE_CLOSURE,
  POOL_API_DOCS,
  POOL_CPU_ALERT,
  POOL_Q4_REVIEW,
];

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const result = [...array];
  const random = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function buildInboxEmails(mailSeed: number): EmailDefinition[] {
  const phishingVariant = (mailSeed % 2 === 0) ? POOL_PHISHING_LOTTERY : POOL_PHISHING_IT;
  const poolWithPhishing = [...MAIL_POOL, phishingVariant];
  const shuffled = shuffleWithSeed(poolWithPhishing, mailSeed);
  const picked = shuffled.slice(0, 4);
  const withReadState = picked.map((mail, index) => ({
    ...mail,
    id: `${mail.id}-${mailSeed}`,
    read: index >= 2,
  }));
  return [...MANDATORY_MAILS, ...withReadState];
}
