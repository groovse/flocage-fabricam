// Génère les 5 fichiers CSV du dossier « donnees » à partir des valeurs de prix.js et data.js.
// À lancer (node outils/generer-csv.js) après un changement dans prix.js ou data.js, ou pour repartir des valeurs intégrées.
// Attention : écrase les fichiers existants de « donnees ».
var fs = require("fs"), path = require("path");
global.window = { REGLAGES_MANUEL: true };
var racine = path.join(__dirname, "..");
["prix.js", "data.js"].forEach(function (f) { new Function(fs.readFileSync(path.join(racine, "js", f), "utf8")).call(global); });
var R = require(path.join(racine, "js", "reglages.js"));
var out = R.exporter(window.PRIX, window.DATA);
fs.mkdirSync(path.join(racine, "donnees"), { recursive: true });
Object.keys(out).forEach(function (k) { fs.writeFileSync(path.join(racine, R.FICHIERS[k]), out[k], "utf8"); console.log(R.FICHIERS[k], out[k].split("\n").length - 2, "lignes"); });
