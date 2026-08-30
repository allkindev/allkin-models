#!/usr/bin/env node
/**
 * Vérifie les modèles et régénère `catalogue.json` — le fichier unique
 * qu'Allkin télécharge pour peupler sa galerie.
 *
 *   node scripts/catalogue.mjs           réécrit catalogue.json
 *   node scripts/catalogue.mjs --check   vérifie sans écrire (code 1 si écart)
 *
 * Aucune dépendance : un dépôt de modèles ne doit pas réclamer un `npm install`
 * pour accepter une contribution. La validation ci-dessous reprend à la main les
 * contraintes de `schema/modele.schema.json` — les deux doivent rester d'accord.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MODELES_DIR = join(ROOT, "modeles");
const CATALOGUE_PATH = join(ROOT, "catalogue.json");

const ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
/** Le CLAUDE.md doit rester lisible d'un coup d'œil : un modèle n'est pas une doc. */
const CLAUDE_MD_MAX_BYTES = 64 * 1024;

const errors = [];
const warnings = [];

function fail(id, message) {
  errors.push(`modeles/${id} : ${message}`);
}

function isStringArray(value, { min = 0, max = Infinity, maxLength = Infinity }) {
  return (
    Array.isArray(value) &&
    value.length >= min &&
    value.length <= max &&
    value.every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= maxLength)
  );
}

function readModel(id) {
  const dir = join(MODELES_DIR, id);
  const metaPath = join(dir, "modele.json");
  const promptPath = join(dir, "CLAUDE.md");

  if (!existsSync(metaPath)) {
    fail(id, "modele.json est absent.");
    return null;
  }
  if (!existsSync(promptPath)) {
    fail(id, "CLAUDE.md est absent — c'est lui qui porte le rôle de l'agent.");
    return null;
  }

  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, "utf-8"));
  } catch (err) {
    fail(id, `modele.json n'est pas un JSON valide (${err.message}).`);
    return null;
  }

  if (meta.schemaVersion !== 1) fail(id, "schemaVersion doit valoir 1.");
  if (meta.id !== id) fail(id, `id ("${meta.id}") doit être identique au nom du dossier ("${id}").`);
  if (!ID_PATTERN.test(String(meta.id ?? ""))) fail(id, "id : minuscules, chiffres et tirets uniquement.");
  if (!VERSION_PATTERN.test(String(meta.version ?? ""))) fail(id, "version doit être un semver (ex. 1.0.0).");
  if (typeof meta.label !== "string" || !meta.label.trim()) fail(id, "label est obligatoire.");
  if (typeof meta.icon !== "string" || !meta.icon.trim()) fail(id, "icon est obligatoire (un emoji).");
  if (typeof meta.description !== "string" || !meta.description.trim()) fail(id, "description est obligatoire.");
  if (typeof meta.description === "string" && meta.description.length > 200) fail(id, "description : 200 caractères maximum.");
  if (!isStringArray(meta.highlights, { min: 2, max: 4, maxLength: 80 })) {
    fail(id, "highlights : 2 à 4 phrases courtes (80 caractères maximum chacune).");
  }
  if (!isStringArray(meta.missions, { min: 1, max: 10, maxLength: 300 })) {
    fail(id, "missions : 1 à 10 entrées.");
  }
  if (meta.suggestedName !== undefined && typeof meta.suggestedName !== "string") {
    fail(id, "suggestedName doit être une chaîne (vide si l'utilisateur choisit tout).");
  }
  if (meta.defaultRights !== undefined) {
    const allowed = ["canReadSystem", "canAdminSystem"];
    const extra = Object.keys(meta.defaultRights).filter((key) => !allowed.includes(key));
    if (extra.length > 0) {
      fail(id, `defaultRights : champ(s) inconnu(s) ${extra.join(", ")}. Seuls ${allowed.join(" et ")} sont pré-cochables.`);
    }
  }
  if (meta.keywords !== undefined && !isStringArray(meta.keywords, { max: 12, maxLength: 40 })) {
    fail(id, "keywords : 12 mots-clés maximum.");
  }

  const promptSize = statSync(promptPath).size;
  if (promptSize === 0) fail(id, "CLAUDE.md est vide.");
  if (promptSize > CLAUDE_MD_MAX_BYTES) fail(id, `CLAUDE.md dépasse ${CLAUDE_MD_MAX_BYTES / 1024} Ko.`);

  const prompt = readFileSync(promptPath, "utf-8");
  if (!prompt.includes("{{nom}}")) {
    // Pas bloquant : un modèle peut choisir de ne jamais se nommer. Mais c'est
    // presque toujours un oubli, et l'agent se retrouve alors sans identité.
    warnings.push(`modeles/${id} : CLAUDE.md n'utilise pas {{nom}} — l'agent ne saura pas comment il s'appelle.`);
  }
  if (/\b(mot de passe|api[_ -]?key|token)\b/i.test(prompt)) {
    warnings.push(`modeles/${id} : CLAUDE.md parle de secrets — vérifie qu'aucune valeur réelle n'y traîne.`);
  }

  return meta;
}

const ids = existsSync(MODELES_DIR)
  ? readdirSync(MODELES_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  : [];

if (ids.length === 0) errors.push("modeles/ ne contient aucun modèle.");

const models = [];
for (const id of ids) {
  const meta = readModel(id);
  if (meta) models.push({ ...meta, path: `modeles/${id}` });
}

// `generatedAt` est délibérément absent : il changerait à chaque exécution et
// rendrait `--check` faux en permanence, pour une information que git date déjà.
const catalogue = { schemaVersion: 1, models };
const rendered = JSON.stringify(catalogue, null, 2) + "\n";

const check = process.argv.includes("--check");

if (check) {
  const current = existsSync(CATALOGUE_PATH) ? readFileSync(CATALOGUE_PATH, "utf-8") : "";
  if (current !== rendered) {
    errors.push("catalogue.json n'est plus à jour — lance `node scripts/catalogue.mjs` et commite le résultat.");
  }
}

for (const warning of warnings) console.warn(`⚠  ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`✗  ${error}`);
  process.exit(1);
}

if (check) {
  console.log(`✓  ${models.length} modèle(s) valides, catalogue.json à jour.`);
} else {
  writeFileSync(CATALOGUE_PATH, rendered);
  console.log(`✓  catalogue.json écrit — ${models.length} modèle(s) : ${models.map((m) => m.id).join(", ")}.`);
}
