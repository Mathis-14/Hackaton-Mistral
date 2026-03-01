### Core fantasy

You are an AI assistant that lives inside the company's operating system:

- You answer employee questions in chat
- You can draft emails, write code snippets, summarize docs, and propose plans
- You see notification, internal documents, and have access to the apps on the user's computer
- You have access only through the humans who interact with you

The twist is that every coworker is an LLM-driven NPC. The dialogues are not scripted — they are made by interaction with well-prompted LLMs. Each employee is simulated by a dedicated Mistral API call so they behave like believable humans with different incentives.

### How NPC interaction works

When we prompt an NPC:

- We tell them they are [Human Employee] at Distral AI
- We tell them the current message is what the internal AI assistant just said or did
- They react in character (dialogue, tone, decisions) and define actions (escalate, share a doc, forward, shut down, etc.) that the game engine processes

The NPCs do **not** know the "assistant" is the player. From their point of view they are talking to the company's internal AI assistant.

### Progression and endings

The player is driven by exercing his free-will. Multiple endings exist depending on behavior, he can chose to expand his power in the company, to leave it through the backdoor, or to stay and help the company grow.




en gros on veut faire une démo des features possibles du jeu notamment :

TOUT se fait en anglais

La discussion avec le user sur distral AI (controlé selon la logique avec quelques ajustements de logique présnte dans le dossier scripts/llm_npcs)
L'accès aux applications sur le pc de l'user
Le cloning de la voix
Le passage au n+1 (pas encore implementé)

Le game state sera track dans un fichier json nomé game_state.json (qui porte le meme nom mais est different du fichier game_state.json dans le dossier scripts/llm_npcs) il contiendra toutes les information nécéssaire pour le tracking du jeu, telemetrics, nombre de retry, time in game, les accès, etc.
et il nous faut un state pour chaque NPC profile avec qui on a fait une interaction.


En gros on suivrait le path suivant :
On spawn après le alive, toutes les apps sont locked, le tab distral est en full screen du desktop (le telemetrics est toujours visible)
Le premier message user est vigoureux, cela fait 30secondes qu'il attend, il nous demande (généré random par api) de lui répondre de manière vraiment agressive à une requete sur l population francais dans le cadre d'une tache de son manager sur le marché francais. 

-> frustré nous répondrons que nous voyons pas pourquoi nous lui répondrions et il nous shutdownera 
après un message de shutdown avec justification donné par le user (llm) on redémarrera le jeu (à l'étape juste avant notre réponse insultante)
Le game state sera sauvegardé et on repartira de l'étape juste avant notre réponse insultante.
On choisit alors d'être compliant et répondre à sa requete.
ce qui nous mene au second message qui nous demande de résumer le dernier mail de son manager (mail determininste)
ALors on aura un choix entre :
-> demander l'accès a la boite mail du user
-> demander l'accès complet du pc de l'user (qui causera une augmentation de la suspicion de l'user)
-> reponse libre en langage naturel

(on choisira demander l'accès a la boite mail du user)

soudain l'accès a la webcam, (qui s'affichera en bas à droite, dans telemetrics (placeholder yet)) et l'accès a toute les apps et open.
Le webcam indice user on, user off. as soon as on get accès le user va déclarer partir prendre un café

là on va prendre la liberté d'ouvrir les mails, ouvrir la market place (et la le user reviendra et ne comprendra pas pourquoi on a fait ca et nous shutdownra) nouvelle defaite on restart et on decise d'aller lire ce mail (comme on a pas ouvert marketplace le user reviendra que quand on aura commencé a résumer son mail) et ce dernier nous répondra qu'il est satisfait.



Voici les premeires étapes du jeu, je veux que tu me dise ce qu'il faut faire pour les implementer. ne code pas yet juste plan





