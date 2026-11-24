/*
=========================================
Wedding Domaines Planner
excelExport.js
=========================================
*/

async function exportDomainsToExcel() {

    try {

        const domains = await loadDomains();

        if (!domains || domains.length === 0) {

            alert(
                "Aucun domaine enregistré."
            );

            return;
        }

        const workbook =
            XLSX.utils.book_new();

        /*
        =========================================
        ONGLET RÉSUMÉ
        =========================================
        */

        const summaryData = [

            [
                "Classement",
                "Domaine",
                "Score",
                "Prix",
                "Date visite",
                "Contact"
            ]

        ];

        const sortedDomains =
            [...domains]

            .sort(
                (a, b) =>
                    b.score - a.score
            );

        sortedDomains.forEach(

            (domain, index) => {

                summaryData.push([

                    index + 1,

                    domain.domainName || "",

                    domain.score || 0,

                    domain.estimatedPrice || "",

                    domain.visitDate || "",

                    domain.contactName || ""

                ]);

            }

        );

        const summarySheet =
            XLSX.utils.aoa_to_sheet(
                summaryData
            );

        XLSX.utils.book_append_sheet(

            workbook,

            summarySheet,

            "Classement"

        );

        /*
        =========================================
        ONGLET PAR DOMAINE
        =========================================
        */

        sortedDomains.forEach(
            domain => {

                const sheetData = [];

                sheetData.push([
                    "Informations générales"
                ]);

                sheetData.push([]);

                sheetData.push([
                    "Nom du domaine",
                    domain.domainName || ""
                ]);

                sheetData.push([
                    "Date visite",
                    domain.visitDate || ""
                ]);

                sheetData.push([
                    "Prix annoncé",
                    domain.estimatedPrice || ""
                ]);

                sheetData.push([
                    "Contact",
                    domain.contactName || ""
                ]);

                sheetData.push([
                    "Téléphone",
                    domain.contactPhone || ""
                ]);

                sheetData.push([
                    "Email",
                    domain.contactEmail || ""
                ]);

                sheetData.push([
                    "Score global",
                    domain.score || 0
                ]);

                sheetData.push([]);
                sheetData.push([
                    "Réponses questionnaire"
                ]);

                sheetData.push([]);

                if (domain.answers) {

                    Object.entries(
                        domain.answers
                    )

                    .forEach(

                        ([key, value]) => {

                            sheetData.push([
                                key,
                                value
                            ]);

                        }

                    );

                }

                sheetData.push([]);
                sheetData.push([
                    "Commentaires"
                ]);

                if (domain.notes) {

                    Object.entries(
                        domain.notes
                    )

                    .forEach(

                        ([key, value]) => {

                            sheetData.push([
                                key,
                                value
                            ]);

                        }

                    );

                }

                sheetData.push([]);
                sheetData.push([
                    "Notes générales"
                ]);

                sheetData.push([
                    domain.generalNotes || ""
                ]);

                const worksheet =
                    XLSX.utils.aoa_to_sheet(
                        sheetData
                    );

                const safeName =
                    (domain.domainName ||
                        "Domaine")

                    .substring(0, 31)

                    .replace(/[\\/*?:[\]]/g, "");

                XLSX.utils.book_append_sheet(

                    workbook,

                    worksheet,

                    safeName

                );

            }
        );

        /*
        =========================================
        ONGLET STATISTIQUES
        =========================================
        */

        const averageScore =
            Math.round(

                domains.reduce(

                    (sum, domain) =>

                        sum +
                        (domain.score || 0),

                    0

                )
                /
                domains.length

            );

        const statsSheet =
            XLSX.utils.aoa_to_sheet([

                [
                    "Statistique",
                    "Valeur"
                ],

                [
                    "Nombre de domaines",
                    domains.length
                ],

                [
                    "Score moyen",
                    averageScore
                ],

                [
                    "Meilleur score",
                    sortedDomains[0]
                        ?.score || 0
                ],

                [
                    "Domaine favori",
                    sortedDomains[0]
                        ?.domainName || ""
                ]

            ]);

        XLSX.utils.book_append_sheet(

            workbook,

            statsSheet,

            "Statistiques"

        );

        /*
        =========================================
        EXPORT FICHIER
        =========================================
        */

        const exportDate =
            new Date()

            .toISOString()

            .split("T")[0];

        XLSX.writeFile(

            workbook,

            `Comparatif_Domaines_${exportDate}.xlsx`

        );

    }

    catch(error) {

        console.error(error);

        alert(
            "Erreur lors de l'export Excel."
        );

    }

}

/*
=========================================
EXPORT JSON
=========================================
*/

async function exportRawData() {

    const domains =
        await loadDomains();

    const file = {

        exportDate:
            new Date().toISOString(),

        version: "1.0",

        domains

    };

    const blob =
        new Blob(

            [
                JSON.stringify(
                    file,
                    null,
                    2
                )
            ],

            {
                type:
                "application/json"
            }

        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "WeddingDomainesBackup.json";

    link.click();

}

/*
=========================================
BOUTON EXPORT
=========================================
*/

document.addEventListener(

    "DOMContentLoaded",

    () => {

        const button =
            document.getElementById(
                "btnExportExcel"
            );

        if (button) {

            button.addEventListener(

                "click",

                exportDomainsToExcel

            );

        }

    }

);

/*
=========================================
UTILITAIRES
=========================================
*/

function excelValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return value;

}
