# allkin-models

Les **modèles d'agent** d'[Allkin](https://github.com/ctrlmakeit/allkin).

Un modèle est un métier prêt à l'emploi : un rôle déjà écrit, des missions, un ton, et les
droits que ce métier réclame. Depuis Allkin, `+` → **Parcourir les modèles** lit ce dépôt
et installe celui que tu choisis. Rien n'est figé ensuite : le prompt de l'agent créé
t'appartient, et reste modifiable depuis sa page.

Ce dépôt n'est **pas** un dépôt de code. Aucune dépendance, aucun `npm install` : un modèle,
c'est un dossier, un JSON et un Markdown.

---

## Ce que contient un modèle

```
modeles/secretaire/
├── modele.json    ce qu'affiche la galerie + les droits proposés
└── CLAUDE.md      le rôle de l'agent — le vrai contenu du modèle
```

### `modele.json`

```jsonc
{
  "schemaVersion": 1,
  "id": "secretaire",              // identique au nom du dossier
  "version": "1.0.0",              // semver, à incrémenter à chaque modification
  "label": "Secrétaire",           // le métier, sur la carte
  "icon": "🗂️",                     // un emoji, un seul
  "suggestedName": "Secrétaire",   // nom d'agent proposé par défaut
  "description": "Agenda, courriers, relances et comptes rendus.",
  "highlights": [                  // 2 à 4 exemples concrets, pas des promesses
    "Rédige et relit les courriers",
    "Tient un suivi des relances",
    "Prépare les comptes rendus"
  ],
  "missions": [                    // reprises dans le prompt système de l'agent
    "Rédiger et relire courriers, courriels et notes…"
  ],
  "defaultRights": {},             // droits PRÉ-COCHÉS, jamais accordés d'office
  "keywords": ["bureau", "administratif"],
  "author": { "name": "Allkin", "url": "https://github.com/ctrlmakeit/allkin" },
  "license": "MIT"
}
```

Le format complet est décrit dans [`schema/modele.schema.json`](schema/modele.schema.json).

### `CLAUDE.md`

Le rôle de l'agent, en Markdown. Allkin y remplace `{{nom}}` par le nom réel donné à l'agent
au moment de sa création — utilise-le, sinon l'agent ne saura pas comment il s'appelle.

Un gabarit qui marche bien :

```markdown
# Rôle
Agent "{{nom}}" — ce qu'il fait, en deux phrases.

# Missions
- …

# Ton
Comment il répond.

# Espace de travail
Ton dossier `data/` est ton espace de travail : …
```

**N'y écris jamais de règle de sécurité** (« ne fais pas ceci », « demande validation avant
cela »). Allkin génère ce bloc lui-même à chaque session, à partir des droits réels de
l'agent — le mettre dans le `CLAUDE.md` le rendrait faux dès qu'un droit change, et
effaçable par l'utilisateur.

---

## `catalogue.json`

Le fichier que télécharge Allkin : tous les `modele.json` du dépôt en un seul appel, sans
les `CLAUDE.md` (récupérés seulement à l'installation d'un modèle).

Il est **généré**, jamais édité à la main :

```bash
node scripts/catalogue.mjs          # régénère catalogue.json
node scripts/catalogue.mjs --check  # vérifie les modèles + que le catalogue est à jour
```

---

## Contribuer un modèle

Voir [CONTRIBUTING.md](CONTRIBUTING.md). En résumé : un dossier sous `modeles/`, les deux
fichiers, `node scripts/catalogue.mjs`, une pull request.

## Installer un modèle sans passer par la galerie

Allkin sait aussi importer une **archive `.zip`** — pratique pour un modèle qu'on garde
pour soi, ou qu'on s'échange sans passer par une pull request. L'archive contient les deux
fichiers, à sa racine ou dans un dossier unique :

```
mon-modele.zip
└── mon-modele/
    ├── modele.json
    └── CLAUDE.md
```

Depuis Allkin : `+` → **Importer un modèle**.

## Licence

[MIT](LICENSE) pour le dépôt et les modèles qu'il contient. Un modèle contribué peut porter
sa propre licence via le champ `license` de son `modele.json`.
