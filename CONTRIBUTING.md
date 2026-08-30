# Contribuer un modèle

## La marche à suivre

1. Crée `modeles/<id>/` — l'`id` en minuscules, chiffres et tirets, et c'est lui qui sert
   d'identifiant partout.
2. Écris `modele.json` et `CLAUDE.md`. Le plus simple est de recopier un modèle voisin.
3. Lance `node scripts/catalogue.mjs` (aucune dépendance à installer) et commite le
   `catalogue.json` régénéré.
4. Ouvre une pull request. La vérification automatique refait le même contrôle.

## Ce qu'on attend d'un modèle

**Un métier, pas un outil.** « Comptable » est un modèle ; « convertir un CSV en JSON » est
une tâche — ça n'a pas besoin d'un agent dédié.

**Des missions vérifiables.** Chaque mission décrit un travail que l'agent fait vraiment, pas
une qualité qu'on lui souhaite. « Rapprocher les relevés bancaires des pièces comptables et
signaler les écarts » plutôt que « être rigoureux ».

**Un ton assumé.** C'est ce qui distingue deux modèles au même métier. Dis comment l'agent
répond, et ce qu'il refuse de faire à moitié.

**Le moins de droits possible.** `defaultRights` ne pré-coche que ce dont le métier a
*besoin* :

| Droit | Quand le pré-cocher |
| --- | --- |
| *(aucun)* | Le cas normal. Un agent qui rédige, calcule ou range n'a rien à faire sur la machine. |
| `canReadSystem` | Le métier consiste à constater l'état de la machine (développeur qui diagnostique). |
| `canAdminSystem` | Le métier *est* l'administration de la machine. Un seul modèle le justifie aujourd'hui. |

Ces droits restent une **proposition** : l'utilisateur les voit et les modifie à l'étape
« Droits » de la création. Mais un modèle qui en réclame trop sera refusé — la case déjà
cochée est celle qu'on ne relit pas.

Les autres droits (gestion des agents, autoprompt, services externes) ne sont pas
pré-cochables : ils se donnent à la main, en connaissance de cause.

## Ce qui fait refuser une contribution

- Un `CLAUDE.md` qui contient des règles de sécurité ou de validation : Allkin les génère
  lui-même à chaque session, à partir des droits réels. Les dupliquer les rend fausses.
- Un `CLAUDE.md` qui contient une clé, un jeton, une URL interne, un nom de personne réelle.
- Un modèle qui promet un accès qu'Allkin n'accorde pas (« tu peux envoyer des courriels »
  alors qu'aucun service n'est connecté).
- Un métier déjà couvert : propose plutôt une amélioration du modèle existant.

## Modifier un modèle existant

Incrémente sa `version` :

- **patch** (1.0.**1**) — une reformulation, une faute corrigée ;
- **mineure** (1.**1**.0) — une mission ajoutée, un ton précisé ;
- **majeure** (**2**.0.0) — le métier change de nature.

Les agents déjà créés ne sont **jamais** modifiés rétroactivement : un modèle est un point de
départ recopié à la création, pas une dépendance vivante.
