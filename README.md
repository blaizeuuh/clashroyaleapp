# CRStats — Profil Joueur Clash Royale

Interface web minimaliste pour consulter le profil d'un joueur Clash Royale en temps réel via l'API officielle Supercell.

---

## Fonctionnalités

- Recherche par tag de joueur
- Trophées, record personnel, arène actuelle
- Statistiques : victoires, défaites, 3 couronnes, XP, points étoile…
- Barre de taux de victoire avec code couleur
- Deck actuel avec coût élixir moyen
- Cartes favorites
- Collection complète avec filtre par rareté
- Statistiques de ligue (saisons)
- Tooltips au survol des cartes

---

## Structure du projet

```
Clash_royale/
├── index.html            # Point d'entrée
├── css/
│   └── style.css         # Tous les styles
├── js/
│   └── app.js            # Logique applicative
├── config.js             # ⚠️ Clé API — gitignored, à créer localement
├── config.example.js     # Template de config à copier
└── .gitignore
```

---

## Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/TON_PSEUDO/clash-royale-stats.git
cd clash-royale-stats
```

### 2. Configurer la clé API

```bash
cp config.example.js config.js
```

Ouvrez `config.js` et remplacez `VOTRE_CLE_API_CLASH_ROYALE` par votre jeton :

```js
const API_KEY = 'eyJ0eXAiOiJKV1Q...';
```

> **Obtenir une clé :** rendez-vous sur [developer.clashroyale.com](https://developer.clashroyale.com/), créez une application et autorisez votre adresse IP publique.

### 3. Lancer

Ouvrez `index.html` directement dans un navigateur, **ou** servez le dossier avec n'importe quel serveur statique :

```bash
# Exemple avec Python
python -m http.server 8080
# puis ouvrez http://localhost:8080
```

---

## Note sur le CORS

L'API Clash Royale bloque les requêtes depuis le navigateur (CORS).  
Pour contourner cela en développement, vous pouvez utiliser :
- Une extension navigateur de type **CORS Unblock**
- Un proxy local (ex. [local-cors-proxy](https://github.com/garmeeh/local-cors-proxy))
- Un proxy public comme `https://api.allorigins.win` (déjà défini dans `app.js` comme `PROXY`)

---

## Technologies

- HTML5 / CSS3 / JavaScript vanilla
- [API officielle Clash Royale](https://developer.clashroyale.com/)
- Polices : [Rajdhani](https://fonts.google.com/specimen/Rajdhani) + [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)

---

## Licence

MIT
