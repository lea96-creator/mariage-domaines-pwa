# Wedding Domaines Planner

Application simple pour noter, pendant les visites, les réponses à 110 questions
sur des domaines de mariage (4 jours), puis produire un classeur Excel analysable.

Aucun serveur, aucun compte, aucune base de données distante : **les données
restent dans le navigateur de l'appareil utilisé**.

Les améliorations à traiter plus tard sont notées dans [TODO.md](TODO.md).

## Fonctionnement

- Une seule page (`index.html`) avec quatre écrans : accueil, fiche du domaine,
  visite, comparatif. La navigation reste en haut de l’écran ; le titre
  « Domaines » ramène à l’accueil.
- Les boutons **Enregistrer / Modifier** et **Retour** restent accessibles en
  bas de l’écran pendant le défilement.
- Le bouton clair/sombre est dans l’en-tête. Au départ, l’application suit le
  réglage du téléphone ou de l’ordinateur ; dès qu’on appuie sur le bouton, le
  choix est mémorisé sur l’appareil.
- Le formulaire de visite est découpé en étapes : informations, une étape par
  catégorie de questions, puis notes et score. Les étapes déjà remplies sont
  signalées ; le bouton **Questions** ouvre la liste complète pour sauter
  directement à une question.
- Les domaines sont stockés dans `localStorage` sous la clé `wedding-domaines:v1`.
- Les domaines sont créés depuis l’accueil et supprimés depuis le classement.
- Le classement peut être filtré avec le champ de recherche.
- Cliquer un domaine ouvre sa fiche en lecture seule, avec seulement les
  champs remplis. Le bouton **Modifier** ouvre le formulaire, puis on revient
  à la fiche après enregistrement.
- Le catalogue des questions est dans `data/questions.json`. Modifier ce
  fichier, publier à nouveau le site et la liste se met à jour sans compilation.
  Si le fichier est absent ou invalide, l’application utilise la copie intégrée
  dans `js/questions.js` pour continuer à fonctionner.
- Le score est calculé à partir du catalogue chargé :
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

Le serveur local injecte aussi cinq domaines fictifs tirés de
`fixtures/domains.json` dans le navigateur. Chaque rechargement repart de ces
données, ce qui permet de parcourir tous les écrans avec du contenu réaliste.
Cette injection vient uniquement du serveur de dev : le site publié ne contient
aucun code ni aucun écran de démonstration. Pour la désactiver :

```bash
FIXTURES=0 node scripts/serve.mjs
```

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
node --test tests/*.test.mjs   # score, CRUD, sauvegardes et serveur de dev
node --check js/*.js scripts/serve.mjs
```

Structure :

```
index.html               interface
css/style.css            styles
data/questions.json      catalogue éditable des questions
js/questions.js          repli du catalogue, index, calcul du score
js/questionLoader.js     chargement et validation du JSON
js/theme.js              thème clair/sombre et mémorisation du choix
js/store.js              état local + CRUD + sauvegarde
js/domainView.js         recherche et fiche de lecture
js/formSteps.js          étapes du formulaire et questions associées
js/transfer.js           partage / import du fichier JSON
js/excelExport.js        génération du classeur
js/ui.js                 rendu et événements
js/vendor/xlsx.full.min.js   SheetJS (local, hors ligne)
fixtures/domains.json    cinq domaines inventés (serveur de dev uniquement)
sw.js                    cache versionné
manifest.json            installation PWA
tests/state.test.mjs     tests
tests/domainView.test.mjs tests de la recherche et de la fiche
tests/formSteps.test.mjs tests des étapes du formulaire
tests/questionLoader.test.mjs tests du catalogue JSON
tests/serve.test.mjs     tests de l'injection des fixtures
scripts/serve.mjs        serveur statique local avec injection de dev
```
