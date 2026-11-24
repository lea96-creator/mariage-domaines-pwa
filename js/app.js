/*
=========================================
Wedding Domaines Planner
app.js
=========================================
*/

let currentDomain = null;
let domaines = [];

/*
=========================================
INITIALISATION
=========================================
*/

document.addEventListener(
    "DOMContentLoaded",

    async () => {

        await initDatabase();

        await loadStoredDomains();

        initializeNavigation();

        initializeButtons();

        generateQuestionnaire();

        refreshDashboard();

    }

);
/*
=========================================
NAVIGATION
=========================================
*/

function initializeNavigation() {

    document
        .querySelectorAll(".bottom-nav button")
        .forEach(button => {

            button.addEventListener("click", () => {

                const page =
                    button.dataset.page;

                showPage(page);

            });

        });

}

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });

    const page =
        document.getElementById(pageId);

    if (page) {

        page.classList.add("active");

    }

}

/*
=========================================
BOUTONS
=========================================
*/

function initializeButtons() {

    const btnNew =
        document.getElementById(
            "btnNewDomain"
        );

    if (btnNew) {

        btnNew.addEventListener(
            "click",
            createNewDomain
        );

    }

    const btnSave =
        document.getElementById(
            "btnSave"
        );

    if (btnSave) {

        btnSave.addEventListener(
            "click",
            saveCurrentDomain
        );

    }

    const btnBack =
        document.getElementById(
            "btnBack"
        );

    if (btnBack) {

        btnBack.addEventListener(
            "click",
            () => {

                showPage("dashboard");

            }
        );

    }

}

/*
=========================================
NOUVEAU DOMAINE
=========================================
*/

function createNewDomain() {

    currentDomain = null;

    clearForm();

    showPage("domainForm");

}

/*
=========================================
QUESTIONNAIRE
=========================================
*/

function generateQuestionnaire() {

    const container =
        document.getElementById(
            "questionnaireContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    QUESTION_CATEGORIES.forEach(category => {

        const categoryCard =
            document.createElement("div");

        categoryCard.className = "card";

        let html = `
            <h2>
                ${category.title}
            </h2>
        `;

        category.questions.forEach(
            (question, index) => {

                const questionId =
                    `${category.id}_${index}`;

                html += `

                    <div class="question">

                        <div class="question-title">
                            ${question}
                        </div>

                        <select
                            class="question-answer"
                            data-question="${questionId}"
                        >

                            <option value="">
                                Sélectionner
                            </option>

                            <option value="yes">
                                ✅ Oui
                            </option>

                            <option value="partial">
                                ⚠️ Partiel
                            </option>

                            <option value="no">
                                ❌ Non
                            </option>

                            <option value="unknown">
                                ❓ Inconnu
                            </option>

                        </select>

                        <textarea
                            class="question-note"
                            data-note="${questionId}"
                            placeholder="Commentaires..."
                        ></textarea>

                    </div>
                `;

            }
        );

        categoryCard.innerHTML = html;

        container.appendChild(categoryCard);

    });

    attachScoreListeners();

}

/*
=========================================
SCORE
=========================================
*/

function attachScoreListeners() {

    document
        .querySelectorAll(".question-answer")
        .forEach(select => {

            select.addEventListener(
                "change",
                calculateScore
            );

        });

}

function calculateScore() {

    let total = 0;

    let answered = 0;

    document
        .querySelectorAll(".question-answer")
        .forEach(select => {

            const value =
                select.value;

            if (
                value &&
                ANSWER_VALUES[value] !== undefined
            ) {

                total +=
                    ANSWER_VALUES[value];

                answered++;

            }

        });

    const maxScore =
        TOTAL_QUESTIONS * 10;

    const percentage =
        answered === 0
            ? 0
            : Math.round(
                (total / maxScore) * 100
            );

    const scoreContainer =
        document.getElementById(
            "totalScore"
        );

    if (scoreContainer) {

        scoreContainer.innerHTML =
            `${percentage} / 100`;

    }

    return percentage;

}

/*
=========================================
LECTURE FORMULAIRE
=========================================
*/

function getFormData() {

    const answers = {};

    document
        .querySelectorAll(".question-answer")
        .forEach(select => {

            answers[
                select.dataset.question
            ] = select.value;

        });

    const notes = {};

    document
        .querySelectorAll(".question-note")
        .forEach(note => {

            notes[
                note.dataset.note
            ] = note.value;

        });

    return {

        id:
            currentDomain?.id ||
            Date.now(),

        domainName:
            document.getElementById(
                "domainName"
            ).value,

        visitDate:
            document.getElementById(
                "visitDate"
            ).value,

        contactName:
            document.getElementById(
                "contactName"
            ).value,

        contactPhone:
            document.getElementById(
                "contactPhone"
            ).value,

        contactEmail:
            document.getElementById(
                "contactEmail"
            ).value,

        estimatedPrice:
            document.getElementById(
                "estimatedPrice"
            ).value,

        notes,

        answers,

        generalNotes:
            document.getElementById(
                "generalNotes"
            ).value,

        score:
            calculateScore()

    };

}

/*
=========================================
ENREGISTREMENT
=========================================
*/

async function loadStoredDomains() {

    try {

        domaines =
            await loadDomains();

    }

    catch(error) {

        console.error(error);

        domaines = [];

    }

}
/*
=========================================
CHARGEMENT
=========================================
*/

function loadStoredDomains() {

    const stored =
        localStorage.getItem(
            "weddingDomains"
        );

    if (stored) {

        domaines =
            JSON.parse(stored);

    }

}

/*
=========================================
DASHBOARD
=========================================
*/

function refreshDashboard() {

    const count =
        document.getElementById(
            "totalDomains"
        );

    if (count) {

        count.innerHTML =
            domaines.length;

    }

    const ranking =
        document.getElementById(
            "rankingList"
        );

    if (!ranking) return;

    ranking.innerHTML = "";

    const sortedDomains =
        [...domaines]
            .sort(
                (a,b) =>
                    b.score - a.score
            );

    if (
        sortedDomains.length === 0
    ) {

        ranking.innerHTML = `
            <div class="empty-state">
                Aucun domaine enregistré
            </div>
        `;

        return;

    }

    sortedDomains.forEach(
        (domain, index) => {

            ranking.innerHTML += `
                <div class="ranking-item">

                    <div>

                        ${index + 1}. 
                        ${domain.domainName}

                    </div>

                    <div class="ranking-score">

                        ${domain.score}/100

                    </div>

                </div>
            `;

        }
    );

    updateBestScore(
        sortedDomains
    );

}

function updateBestScore(
    domains
) {

    const best =
        domains[0];

    const score =
        document.getElementById(
            "bestScore"
        );

    if (
        score &&
        best
    ) {

        score.innerHTML =
            best.score;

    }

    const favorite =
        document.getElementById(
            "favoriteDomain"
        );

    if (
        favorite &&
        best
    ) {

        favorite.innerHTML =
            best.domainName;

    }

}

/*
=========================================
RESET
=========================================
*/

function clearForm() {

    document
        .querySelectorAll(
            "input, textarea"
        )
        .forEach(field => {

            field.value = "";

        });

    document
        .querySelectorAll(
            ".question-answer"
        )
        .forEach(select => {

            select.value = "";

        });

    calculateScore();

}
