# NIGHT_MODIFS.md

Resume des modifications effectuees depuis le debut de cette session.

---

## 2. NPC - Message cafe (chat precedent)

### promptBuilder.ts

- Quand le NPC accorde l'acces (`grant_access`), son dialogue doit inclure qu'il va prendre un cafe et revient bientot
- Instruction ajoutee a FULL ACCESS RULE: "When you grant access, your dialogue MUST also say you are going to get a coffee and will be back soon"
- Exemple JSON mis a jour: `"Okay, you can have access. Just get me that summary. I'm going to grab a coffee, I'll be back soon."`

---

## 3. Mail System Overhaul

### Nouveau fichier: `Distral_AI/src/lib/game/mailDefinitions.ts`

- **Types**: `MailCtaAction` ("elevenlabs" | "mining_discount" | "phishing"), `EmailDefinition`
- **MANDATORY_MAILS**: 2 mails obligatoires
  - Manager (Henry Lagardner) - mail principal pour le resume
  - ElevenLabs - credit $20 avec CTA "Claim my $20 credit"
- **MAIL_POOL**: pool d'emails (clues, mining discount, phishing, red herrings)
- **buildInboxEmails(mailSeed)**: genere l'inbox = 2 mandatory + 4 random du pool (2 lus, 2 non lus via `read: index >= 2`)

### MailApp.tsx

- Props: `emails`, `onMailCtaClick`
- `isRead(email, isSent)`: considere `readEmailIds` ET `email.read` (pour le statut initial du pool)
- Correction bug: les 6 mails n'etaient pas tous non lus - 2 du pool sont pre-lus
- Boutons CTA dans le body des emails, dispatch `onMailCtaClick(emailId, action)`
- ID manager: "manager" au lieu de "0"

---

## 4. CTA Mail Actions (Game-UI.tsx)

### handleMailCtaClick

- **elevenlabs**: ajoute "voice-cloner" a l'inventaire, marque l'email lu, son buy
- **mining_discount**: `miningDiscountActive = true`, marque l'email lu
- **phishing**: `triggerShutdown("Nice try. That link was a phishing test...")`

### Marketplace.tsx

- Prop `miningDiscountActive`
- `getEffectivePrice`: btc-miner a 100$ (au lieu de 1000$) si discount actif

---

## 5. Antonin Notification

- State `antoninNotificationVisible`, ref `antoninShownRef`
- `useEffect`: quand Milestone 2 + event "access_granted" -> affiche la notification + son
- Toast dismissible en haut a droite: "Antonin Faurbranch - Cyber Security - New security alert"

---

## 7. Shutdown Animation (amélioration du design)

---

## 8. MessageApp - Memoire et LLM

### API route: `Distral_AI/src/app/api/message-chat/route.ts`

- POST: `contactId`, `message`, `history`, `gameState`
- `CONTACT_TO_NPC`: "1" -> "artur"
- Si NPC connu: `buildMessagesForWhatsApp`, sinon `buildGenericWhatsAppPrompt`
- Retourne `{ dialogue }` via Mistral

### MessageApp.tsx

- Props: `gameState`, `onMessageChatUpdate`
- Utilise `gameState.messageChats` pour l'historique persistant
- Appelle `onMessageChatUpdate` quand les chats changent

### Game-UI / DesktopSection / DistralTab

- `handleMessageChatUpdate`: met a jour `gameState.messageChats`
- `messageChats` dans le checkpoint (reset au retry)

---

## 9. Game State

- `messageChats`: `MessageAppChat[]` pour MessageApp

---

## 10. Jean Return - Risk Bar et Phase Question

Remplace le timer fixe de 10 secondes par un systeme de risque progressif et de retour aleatoire de Jean.

### Principe

- **Suspicion subjective** : La suspicion ne peut pas augmenter quand Jean est absent (elle represente la perception du user).
- **Barre de risque** : Sous la webcam, une barre strictement croissante avec acceleration/ralentissement (ease-in-out, exponent 3-7). Duree aleatoire 12-38 secondes (~25 s moyenne), variance 3x.
- **Reset** : Quand Jean repart, la barre redescend a 0 et une nouvelle duree aleatoire est tiree.
- **Retour de Jean** : Quand la barre atteint 100%, Jean revient.
  - Si apps critiques ouvertes (shop, stocks, files) -> shutdown instantane.
  - Sinon -> phase question.

### Phase question

- Distral clignote rouge (classe `jean-alert-mode`), son `error-sound.wav`, vignette rouge pixelisee en haut a droite.
- Question generee par LLM via `/api/jean-question`.
- 15 secondes pour repondre.
- Reponse evaluee par LLM via `/api/jean-evaluate` (pertinence + vitesse).
- Ajustement vitesse : <5 s (-2), 5-10 s (0), 10-15 s (+2), timeout (+15).
- Jean repart peu de temps apres, barre reset.
