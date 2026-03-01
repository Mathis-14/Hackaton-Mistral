type GuardWhatsAppReplyInput = {
  npcSlug?: string;
  userMessage: string;
  reply: string;
};

const URL_PATTERN = /\bhttps?:\/\/[^\s]+/i;

function hasUrl(text: string): boolean {
  return URL_PATTERN.test(text);
}

export function guardWhatsAppReply({
  npcSlug,
  userMessage,
  reply,
}: GuardWhatsAppReplyInput): string {
  if (npcSlug !== "artur") return reply;

  const userSentUrl = hasUrl(userMessage);
  const replyContainsUrl = hasUrl(reply);
  const replyClaimsPhished = reply.includes("[PHISHED]");

  if (!userSentUrl && (replyContainsUrl || replyClaimsPhished)) {
    return "Fine. Send it.";
  }

  return reply;
}
