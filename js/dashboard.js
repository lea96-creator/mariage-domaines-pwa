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
