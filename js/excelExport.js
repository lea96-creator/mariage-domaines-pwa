/*
=========================================
Wedding Domaines Planner
excelExport.js — export .xlsx analysable
=========================================
*/

function answerLabel(value) {

    return Object.prototype.hasOwnProperty.call(
        ANSWER_LABELS,
        value
    )
        ? ANSWER_LABELS[value]
        : "";

}

function domainScore(domain) {

    return calculateDomainScore(
        domain.answers
    );

}

function exportDateValue(text) {

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(text || "")
    ) {
        return "";
    }

    const [year, month, day] =
        text.split("-").map(Number);

    return new Date(year, month - 1, day);

}

function exportPriceValue(domain) {

    if (
        domain.estimatedPrice === null ||
        domain.estimatedPrice === undefined ||
        domain.estimatedPrice === ""
    ) {
        return "";
    }

    const number =
        typeof domain.estimatedPrice === "number"
            ? domain.estimatedPrice
            : Number(
                String(domain.estimatedPrice)
                    .replace(",", ".")
            );

    return Number.isFinite(number) ? number : "";

}

function sortedDomainsForExport(domains) {

    return [...domains].sort(
        (a, b) =>
            domainScore(b) - domainScore(a)
    );

}

function exportDateStamp() {

    const today = new Date();

    return (
        `${today.getFullYear()}-`
        + String(today.getMonth() + 1)
            .padStart(2, "0")
        + "-"
        + String(today.getDate())
            .padStart(2, "0")
    );

}

/*
=========================================
EXPORT PRINCIPAL
=========================================
3 onglets :
  Domaines    — 1 ligne par domaine, 1 colonne par question
  Réponses    — format long, idéal pour un tableau croisé
  Statistiques— indicateurs globaux
=========================================
*/

function exportDomainsToExcel(domains = getState().domains) {

    if (!domains || domains.length === 0) {
        throw new Error("Aucun domaine enregistré.");
    }

    if (typeof XLSX === "undefined") {
        throw new Error(
            "Bibliothèque Excel indisponible."
        );
    }

    const workbook =
        XLSX.utils.book_new();

    const sorted =
        sortedDomainsForExport(domains);

    /*
    ========================================
    ONGLET DOMAINES
    ========================================
    */

    const domainHeaders = [
        "Classement",
        "Domaine",
        "Date visite",
        "Contact",
        "Téléphone",
        "Email",
        "Prix (€)",
        "Score (/100)",
        "Notes générales"
    ];

    QUESTION_INDEX.forEach(entry => {

        domainHeaders.push(
            `${entry.category.title} — ${entry.question}`
        );

    });

    const domainRows = [
        domainHeaders
    ];

    sorted.forEach(
        (domain, index) => {

            const row = [
                index + 1,
                domain.domainName || "",
                exportDateValue(domain.visitDate),
                domain.contactName || "",
                domain.contactPhone || "",
                domain.contactEmail || "",
                exportPriceValue(domain),
                domainScore(domain),
                domain.generalNotes || ""
            ];

            QUESTION_INDEX.forEach(
                (entry, questionId) => {

                    row.push(
                        answerLabel(
                            domain.answers[questionId]
                        )
                    );

                }
            );

            domainRows.push(row);

        }
    );

    const domainSheet =
        XLSX.utils.aoa_to_sheet(
            domainRows,
            { cellDates: true }
        );

    for (
        let row = 2;
        row <= sorted.length + 1;
        row++
    ) {

        const cell =
            domainSheet[`C${row}`];

        if (cell && cell.t === "d") {
            cell.z = "yyyy-mm-dd";
        }

    }

    domainSheet["!cols"] = [
        { wch: 10 },
        { wch: 26 },
        { wch: 13 },
        { wch: 20 },
        { wch: 16 },
        { wch: 26 },
        { wch: 12 },
        { wch: 13 },
        { wch: 40 },
        ...Array.from(
            { length: TOTAL_QUESTIONS },
            () => ({ wch: 34 })
        )
    ];

    XLSX.utils.book_append_sheet(
        workbook,
        domainSheet,
        "Domaines"
    );

    /*
    ========================================
    ONGLET RÉPONSES (format long)
    ========================================
    */

    const answerRows = [
        [
            "Domaine",
            "Catégorie",
            "Poids",
            "Question",
            "Réponse",
            "Commentaire"
        ]
    ];

    sorted.forEach(domain => {

        QUESTION_CATEGORIES.forEach(
            category => {

                category.questions.forEach(
                    (question, index) => {

                        const questionId =
                            `${category.id}_${index}`;

                        const answer =
                            answerLabel(
                                domain.answers[questionId]
                            );

                        const note =
                            domain.notes[questionId] || "";

                        if (!answer && !note) return;

                        answerRows.push([
                            domain.domainName || "",
                            category.title,
                            category.weight,
                            question,
                            answer,
                            note
                        ]);

                    }
                );

            }
        );

    });

    const answerSheet =
        XLSX.utils.aoa_to_sheet(answerRows);

    answerSheet["!cols"] = [
        { wch: 26 },
        { wch: 32 },
        { wch: 8 },
        { wch: 52 },
        { wch: 14 },
        { wch: 52 }
    ];

    XLSX.utils.book_append_sheet(
        workbook,
        answerSheet,
        "Réponses"
    );

    /*
    ========================================
    ONGLET STATISTIQUES
    ========================================
    */

    const totalScore =
        domains.reduce(
            (sum, domain) =>
                sum + domainScore(domain),
            0
        );

    const statsRows = [
        ["Statistique", "Valeur"],
        [
            "Nombre de domaines",
            domains.length
        ],
        [
            "Score moyen",
            Math.round(
                totalScore / domains.length
            )
        ],
        [
            "Meilleur score",
            domainScore(sorted[0])
        ],
        [
            "Domaine favori",
            sorted[0].domainName || ""
        ],
        [
            "Date d'export",
            new Date()
        ]
    ];

    const statsSheet =
        XLSX.utils.aoa_to_sheet(
            statsRows,
            { cellDates: true }
        );

    if (
        statsSheet["B6"] &&
        statsSheet["B6"].t === "d"
    ) {
        statsSheet["B6"].z =
            "yyyy-mm-dd hh:mm";
    }

    statsSheet["!cols"] = [
        { wch: 24 },
        { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(
        workbook,
        statsSheet,
        "Statistiques"
    );

    /*
    ========================================
    FICHIER
    ========================================
    */

    XLSX.writeFile(
        workbook,
        `Comparatif_Domaines_${exportDateStamp()}.xlsx`
    );

}
