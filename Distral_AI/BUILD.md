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
