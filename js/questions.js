/*
=========================================
Wedding Domaines Planner
questions.js — catalogue, réponses, score
=========================================
*/

const DEFAULT_QUESTION_CATEGORIES = [

{
    id: "disponibilites",
    title: "Disponibilités et privatisation",
    weight: 10,
    questions: [
        "La date souhaitée est-elle disponible ?",
        "Le domaine est-il privatisé du vendredi au lundi ?",
        "Aucun autre événement sur le site ?",
        "Arrivée possible le vendredi matin ?",
        "Départ possible le lundi matin ?",
        "Possibilité d'installation dès le vendredi ?",
        "Possibilité de désinstallation le lundi ?",
        "Le contrat précise-t-il l'exclusivité ?",
        "Le domaine peut-il être visité une seconde fois ?",
        "Une option de réservation est-elle possible ?"
    ]
},

{
    id: "hebergement",
    title: "Hébergements",
    weight: 15,
    questions: [
        "Nombre de couchages suffisant ?",
        "Suite des mariés incluse ?",
        "Chambres proches de la réception ?",
        "Hébergements confortables ?",
        "Literie fournie ?",
        "Serviettes fournies ?",
        "Check-in flexible ?",
        "Check-out flexible ?",
        "Hébergements enfants adaptés ?",
        "Hébergements PMR disponibles ?"
    ]
},

{
    id: "restauration",
    title: "Restauration",
    weight: 10,
    questions: [
        "Traiteur libre ?",
        "Cuisine professionnelle disponible ?",
        "Food truck autorisé ?",
        "Bar extérieur autorisé ?",
        "Droit de bouchon acceptable ?",
        "Stockage boissons possible ?",
        "Chambres froides disponibles ?",
        "BBQ autorisé ?",
        "Brunch du dimanche possible ?",
        "Petit déjeuner du lundi possible ?"
    ]
},

{
    id: "ambiance",
    title: "Ambiance guinguette",
    weight: 10,
    questions: [
        "Le lieu correspond-il à l'ambiance recherchée ?",
        "Présence de beaux extérieurs ?",
        "Présence d'arbres et d'ombre ?",
        "Possibilité de guirlandes ?",
        "Brasero autorisé ?",
        "Espace cocktail agréable ?",
        "Vue remarquable ?",
        "Cadre romantique ?",
        "Photogénique ?",
        "Effet coup de cœur immédiat ?"
    ]
},

{
    id: "musique",
    title: "Musique et soirée",
    weight: 10,
    questions: [
        "DJ libre ?",
        "Musique extérieure possible ?",
        "Fin de musique après minuit ?",
        "Aucune plainte récurrente du voisinage ?",
        "Soirée dansante adaptée ?",
        "Espace DJ suffisant ?",
        "Système son possible ?",
        "Jeux de lumière possibles ?",
        "After autorisé ?",
        "Soirée feu de camp possible ?"
    ]
},

{
    id: "exterieurs",
    title: "Espaces extérieurs",
    weight: 10,
    questions: [
        "Cérémonie extérieure possible ?",
        "Cocktail extérieur possible ?",
        "Terrain entretenu ?",
        "Accès facile ?",
        "Aire jeux enfants possible ?",
        "Terrain pétanque possible ?",
        "Molkky possible ?",
        "Eclairage extérieur présent ?",
        "Vue dégagée ?",
        "Sécurité satisfaisante ?"
    ]
},

{
    id: "planB",
    title: "Plan B pluie",
    weight: 10,
    questions: [
        "Tous les invités peuvent être couverts ?",
        "Plan B réellement confortable ?",
        "Salle de repli esthétique ?",
        "Cocktail intérieur possible ?",
        "Cérémonie intérieure possible ?",
        "Mobilier disponible ?",
        "Accès facile sous pluie ?",
        "Pas d'humidité constatée ?",
        "Vent bien géré ?",
        "Aucune contrainte majeure ?"
    ]
},

{
    id: "logistique",
    title: "Logistique",
    weight: 5,
    questions: [
        "Parking suffisant ?",
        "Accès bus/navette ?",
        "Accès PMR correct ?",
        "Signalisation correcte ?",
        "Livraisons faciles ?",
        "Pas de nuisance routière ?",
        "Accès secours ?",
        "Bonne couverture mobile ?",
        "Wifi disponible ?",
        "Toilettes suffisantes ?"
    ]
},

{
    id: "prestataires",
    title: "Prestataires",
    weight: 5,
    questions: [
        "Photographe libre ?",
        "Vidéaste libre ?",
        "Fleuriste libre ?",
        "Wedding planner libre ?",
        "Décorateur libre ?",
        "Pas de prestataire imposé ?",
        "Réseaux partenaires intéressants ?",
        "Bonne réputation des partenaires ?",
        "Flexibilité du domaine ?",
        "Prestataires habitués au lieu ?"
    ]
},

{
    id: "tarifs",
    title: "Budget",
    weight: 10,
    questions: [
        "Tarif cohérent ?",
        "Caution raisonnable ?",
        "Peu de frais cachés ?",
        "Ménage inclus ?",
        "Mobilier inclus ?",
        "Hébergement inclus ?",
        "Heures supplémentaires raisonnables ?",
        "Rapport qualité/prix satisfaisant ?",
        "Offre claire ?",
        "Conditions contractuelles satisfaisantes ?"
    ]
},

{
    id: "coupdecoeur",
    title: "Coup de cœur",
    weight: 5,
    questions: [
        "Je me projette dans ce lieu",
        "Mon conjoint se projette dans ce lieu",
        "Le lieu correspond à notre histoire",
        "Les invités seraient impressionnés",
        "Je signerais aujourd'hui",
        "Je me vois passer 4 jours ici",
        "Le domaine est mémorable",
        "Je le recommanderais",
        "L'émotion est présente",
        "Coup de cœur global"
    ]
}

];

let QUESTION_CATEGORIES =
    DEFAULT_QUESTION_CATEGORIES;

/*
=========================================
RÉPONSES
=========================================
*/

const ANSWER_VALUES = {
    yes: 10,
    partial: 5,
    no: 0
};

const ANSWER_LABELS = {
    yes: "Oui",
    partial: "Partiel",
    no: "Non",
    unknown: "Inconnu",
    "": ""
};

const VALID_ANSWERS = new Set([
    "",
    "yes",
    "partial",
    "no",
    "unknown"
]);

/*
=========================================
INDEX DES QUESTIONS
=========================================
*/

let QUESTION_INDEX = new Map();

let TOTAL_QUESTIONS = 0;

let TOTAL_WEIGHT = 0;

function setQuestionCategories(categories) {

    QUESTION_CATEGORIES =
        Array.isArray(categories) && categories.length
            ? categories
            : DEFAULT_QUESTION_CATEGORIES;

    const index = new Map();

    QUESTION_CATEGORIES.forEach(
        category => {

            category.questions.forEach(
                (question, questionIndex) => {

                    const id =
                        `${category.id}_${questionIndex}`;

                    index.set(id, {
                        id,
                        question,
                        category,
                        index: questionIndex
                    });

                }
            );

        }
    );

    QUESTION_INDEX = index;
    TOTAL_QUESTIONS = index.size;

    TOTAL_WEIGHT =
        QUESTION_CATEGORIES.reduce(
            (sum, category) =>
                sum + category.weight,
            0
        );

    return QUESTION_CATEGORIES;

}

setQuestionCategories(
    DEFAULT_QUESTION_CATEGORIES
);

if (typeof window !== "undefined") {

    window.QuestionCatalogue = {
        defaults: DEFAULT_QUESTION_CATEGORIES,
        getCategories: () => QUESTION_CATEGORIES,
        setCategories: setQuestionCategories,
        getIndex: () => QUESTION_INDEX,
        getTotalQuestions: () => TOTAL_QUESTIONS,
        getTotalWeight: () => TOTAL_WEIGHT
    };

}

/*
=========================================
SCORE
=========================================
Chaque catégorie est notée sur 10 puis
pondérée. "Inconnu" et les questions sans
réponse sont neutres : ils ne sont pas
comptés dans le score.
=========================================
*/

function calculateDomainScore(answers = {}) {

    let earned = 0;
    let weightAnswered = 0;

    QUESTION_CATEGORIES.forEach(category => {

        let categoryPoints = 0;
        let categoryAnswered = 0;

        category.questions.forEach((question, index) => {

            const value =
                answers[`${category.id}_${index}`];

            if (
                Object.prototype.hasOwnProperty.call(
                    ANSWER_VALUES,
                    value
                )
            ) {

                categoryPoints += ANSWER_VALUES[value];
                categoryAnswered++;

            }

        });

        if (categoryAnswered > 0) {

            earned +=
                (categoryPoints / categoryAnswered / 10)
                * category.weight;

            weightAnswered += category.weight;

        }

    });

    if (weightAnswered === 0) return 0;

    return Math.round(
        (earned / weightAnswered) * 100
    );

}
