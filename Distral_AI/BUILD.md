# Build

## macOS: "Too many open files" (ENFILE)

Si le build echoue avec `ENFILE` ou `Too many open files`, augmente la limite systeme:

```bash
sudo sysctl -w kern.maxfiles=65536
sudo sysctl -w kern.maxfilesperproc=32768
```

Puis ferme les autres apps (Chrome, etc.) et relance:

```bash
nvm use 20
npm run build
```

## Node 20 requis

Le build necessite Node 20 (pas Node 25). Utilise `nvm use 20` ou verifie avec `node -v`.

## Deploy AWS Amplify

Sur Amplify, le build tourne dans un environnement propre et ne rencontre pas ce probleme.

### 404 apres deploy

1. **Configurer la plateforme** (CloudShell ou `aws configure` puis):
   ```bash
   ./scripts/fix-amplify-ssr.sh
   ```

2. **Service role** (obligatoire pour SSR): App settings > IAM roles > Edit Service role > Create and use a new service role.

3. **Variable AMPLIFY_MONOREPO_APP_ROOT**: Hosting > Environment variables > ajouter `AMPLIFY_MONOREPO_APP_ROOT` = `Distral_AI` (si pas deja fait par le script).

4. **Redeploy complet**: apres les changements, faire "Redeploy this version" sur le dernier build, ou pousser un nouveau commit.
