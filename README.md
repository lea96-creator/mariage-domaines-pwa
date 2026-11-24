# Wedding Domaines Planner

Application simple pour noter, pendant les visites, les réponses à 110 questions
sur des domaines de mariage (4 jours), puis produire un classeur Excel analysable.

Aucun serveur, aucun compte, aucune base de données distante : **les données
restent dans le navigateur de l'appareil utilisé**.

Les améliorations à traiter plus tard sont notées dans [TODO.md](TODO.md).

## Fonctionnement

- Une seule page (`index.html`) avec trois écrans : accueil, visite, comparatif.
- Les domaines sont stockés dans `localStorage` sous la clé `wedding-domaines:v1`.
- Chaque domaine peut être créé, modifié et supprimé depuis le classement.
- Le score est calculé à partir du catalogue `js/questions.js` :
  - `Oui = 10`, `Partiel = 5`, `Non = 0` ;
  - `Inconnu` et les questions sans réponse sont neutres ;
  - chaque catégorie est notée sur 10 puis pondérée (`poids` total = 100).
- Le score n'est pas figé dans la sauvegarde : il est recalculé avec la version
  courante du questionnaire.

## Lancer en local

```bash
node scripts/serve.mjs
# Port différent :
PORT=3000 node scripts/serve.mjs
```

Puis ouvrir <http://localhost:8080>. Le serveur est un petit script Node sans
aucune dépendance (pas de `npm install`, pas de Python, pas de Go). Le service
worker ne fonctionne que sur `localhost` ou en HTTPS (pas sur `file://`).

## Téléphone vers PC : transférer les données

Le stockage du navigateur est **propre à un appareil et à un navigateur**.
Se connecter avec le même compte Chrome ne synchronise pas `localStorage`.
Il faut donc transférer explicitement une sauvegarde :

1. Sur le **téléphone**, ouvrir la même URL que sur le PC.
2. Saisir les visites, puis toucher **Sauvegarde JSON**.
   - Sur mobile, le partage natif permet d'envoyer le fichier par email, Drive,
     WhatsApp, etc.
   - Sinon le fichier est téléchargé.
3. Sur le **PC**, ouvrir la même URL, cliquer **Restaurer** et choisir le
   fichier `.json`.
4. Confirmer la fusion : les domaines avec le même identifiant sont remplacés,
   les autres ajoutés.
5. Cliquer **Export Excel**.

Variante plus courte : générer le `.xlsx` directement sur le téléphone, envoyer
le fichier sur le PC, puis l'ouvrir dans Excel. Le traitement des données se fait
alors sur le PC sans étape de restauration.

Attention : effacer les données du site, changer de navigateur ou réinstaller l'app
supprime les visites locales. Faire une sauvegarde régulièrement.

## Export Excel

Le classeur contient trois onglets :

| Onglet | Contenu |
|---|---|
| `Domaines` | Une ligne par domaine, une colonne par question avec son intitulé complet (`Catégorie — Question`). Prix en nombre, date de visite typée, score numérique. |
| `Réponses` | Format long `Domaine / Catégorie / Poids / Question / Réponse / Commentaire`, idéal pour un tableau croisé dynamique. |
| `Statistiques` | Nombre de domaines, score moyen, meilleur score, favori, date d'export. |

Les réponses sont libellées en clair (`Oui`, `Partiel`, `Non`, `Inconnu`).

## Déploiement sur GitHub Pages

1. Dans le dépôt : **Settings > Pages > Deploy from a branch**.
2. Choisir `main` et `/(root)`, puis **Save**.
   Le site est publié sur `https://<owner>.github.io/<repo>/`.
3. Cocher **Enforce HTTPS** (obligatoire pour le service worker).
4. Aucun build n'est nécessaire. Le fichier `.nojekyll` désactive le traitement
   Jekyll, et SheetJS est fourni localement dans `js/vendor/`.
5. **À chaque mise à jour du code, incrémenter `CACHE_VERSION` dans `sw.js`
   avant de pousser.** Sinon les visiteurs conservent l'ancienne version en cache.
   Le cache précédent est supprimé automatiquement à l'activation.

Les chemins sont relatifs et le `manifest.json` utilise `"id": "./"` : cela
fonctionne sur un site de projet hébergé dans un sous-dossier. Les raccourcis
`?action=new` et `?action=compare` sont pris en charge au démarrage.

Les données saisies par les visiteurs ne sont jamais envoyées sur GitHub : le
dépôt ne contient que le code de l'application.

## Développement

```bash
node --test tests/*.test.mjs   # score, CRUD et sauvegardes
node --check js/*.js
```

Structure :

```
index.html               interface
css/style.css            styles
js/questions.js          catalogue, pondérations, calcul du score
js/store.js              état local + CRUD + sauvegarde
js/transfer.js           partage / import du fichier JSON
js/excelExport.js        génération du classeur
js/ui.js                 rendu et événements
js/vendor/xlsx.full.min.js   SheetJS (local, hors ligne)
sw.js                    cache versionné
manifest.json            installation PWA
tests/state.test.mjs     tests
scripts/serve.mjs        serveur statique local
```
