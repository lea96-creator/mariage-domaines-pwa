/*
=========================================
Wedding Domaines Planner
dashboard.js
=========================================
*/

let dashboardData = [];

/*
=========================================
INITIALISATION
=========================================
*/

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await initDatabase();

            dashboardData =
                await loadDomains();

            renderDashboardWidgets();

        }

        catch(error) {

            console.error(error);

        }

    }
);
/*
=========================================
REFRESH GLOBAL
=========================================
*/

async function refreshDashboardData() {

    dashboardData =
        await loadDomains();

    renderDashboardWidgets();

}

/*
=========================================
RENDER PRINCIPAL
=========================================
*/

function renderDashboardWidgets() {

    updateStatistics();

    updateRanking();

    updateComparisonTable();

}

/*
=========================================
STATISTIQUES
=========================================
*/

function updateStatistics() {

    const total =
        dashboardData.length;

    const totalEl =
        document.getElementById(
            "totalDomains"
        );

    if (totalEl) {

        totalEl.innerHTML = total;

    }

    if (total === 0) {

        return;

    }

    const best =
        [...dashboardData]
        .sort(
            (a,b) =>
                b.score - a.score
        )[0];

    const bestScoreEl =
        document.getElementById(
            "bestScore"
        );

    if (bestScoreEl) {

        bestScoreEl.innerHTML =
            best.score;

    }

    const favoriteEl =
        document.getElementById(
            "favoriteDomain"
        );

    if (favoriteEl) {

        favoriteEl.innerHTML =
            best.domainName;

    }

}

/*
=========================================
CLASSEMENT
=========================================
*/

function updateRanking() {

    const rankingContainer =
        document.getElementById(
            "rankingList"
        );

    if (!rankingContainer) {

        return;

    }

    rankingContainer.innerHTML = "";

    if (dashboardData.length === 0) {

        rankingContainer.innerHTML = `
            <div class="empty-state">
                Aucun domaine enregistré
            </div>
        `;

        return;

    }

    const sorted =
        [...dashboardData]
        .sort(
            (a,b) =>
                b.score - a.score
        );

    sorted.forEach(
        (domain,index) => {

            const medal =
                index === 0 ?
                "🥇" :

                index === 1 ?
                "🥈" :

                index === 2 ?
                "🥉" :

                "🏡";

            const item =
                document.createElement("div");

            item.className =
                "ranking-item";

            item.innerHTML = `

                <div>

                    ${medal}

                    ${domain.domainName}

                </div>

                <div class="ranking-score">

                    ${domain.score}/100

                </div>

            `;

            rankingContainer.appendChild(
                item
            );

        }
    );

}

/*
=========================================
COMPARAISON
=========================================
*/

function updateComparisonTable() {

    const container =
        document.getElementById(
            "comparisonTable"
        );

    if (!container) return;

    if (dashboardData.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Aucun domaine à comparer
            </div>
        `;

        return;

    }

    const sorted =
        [...dashboardData]
        .sort(
            (a,b) =>
                b.score - a.score
        );

    let html = `

        <table>

            <thead>

                <tr>

                    <th>Domaine</th>
                    <th>Score</th>
                    <th>Prix</th>

                </tr>

            </thead>

            <tbody>

    `;

    sorted.forEach(
        domain => {

            html += `

                <tr>

                    <td>
                        ${domain.domainName}
                    </td>

                    <td>
                        ${domain.score}
                    </td>

                    <td>
                        ${domain.estimatedPrice || "-"}
                    </td>

                </tr>

            `;

        }
    );

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;

}

/*
=========================================
MEILLEUR RAPPORT Q/P
=========================================
*/

function getBestValueDomain() {

    if (
        dashboardData.length === 0
    ) {

        return null;

    }

    let bestRatio = 0;

    let bestDomain = null;

    dashboardData.forEach(
        domain => {

            const price =
                Number(
                    domain.estimatedPrice || 1
                );

            if (price <= 0) {

                return;

            }

            const ratio =
                domain.score / price;

            if (ratio > bestRatio) {

                bestRatio = ratio;

                bestDomain = domain;

            }

        }
    );

    return bestDomain;

}

/*
=========================================
TOP 3
=========================================
*/

function getTopDomains() {

    return [...dashboardData]

        .sort(
            (a,b) =>
                b.score - a.score
        )

        .slice(0,3);

}

/*
=========================================
INDICATEURS
=========================================
*/

function generateInsights() {

    if (dashboardData.length === 0) {

        return [];

    }

    const insights = [];

    const best =
        dashboardData.reduce(
            (best, current) =>
                current.score > best.score
                    ? current
                    : best
        );

    insights.push(
        `🏆 Meilleur domaine : ${best.domainName} (${best.score}/100)`
    );

    const value =
        getBestValueDomain();

    if (value) {

        insights.push(
            `💰 Meilleur rapport qualité/prix : ${value.domainName}`
        );

    }

    return insights;

}
/*
=========================================
EXPORT RAPIDE TABLEAU
=========================================
*/

function getDashboardSummary() {

    return dashboardData.map(
        domain => ({

            domaine:
                domain.domainName,

            score:
                domain.score,

            prix:
                domain.estimatedPrice

        })
    );

}
