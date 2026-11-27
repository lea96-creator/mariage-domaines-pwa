/*
=========================================
Wedding Domaines Planner
formSteps.js — étapes du formulaire
=========================================
*/

(function () {

    "use strict";

    function filled(value) {

        return String(
            value === null || value === undefined
                ? ""
                : value
        ).trim() !== "";

    }

    function buildSteps(categories = []) {

        return [
            {
                id: "info",
                title: "Informations",
                short: "Infos"
            },
            ...categories.map(category => ({
                id: category.id,
                title: category.title,
                short: category.title
            })),
            {
                id: "notes",
                title: "Notes et score",
                short: "Notes"
            }
        ];

    }

    function findQuestionStep(categories = [], questionId = "") {

        const category = categories.find(item =>
            String(questionId).startsWith(`${item.id}_`)
        );

        return category ? category.id : null;

    }

    function isStepComplete(
        stepId,
        categories = [],
        domain = {}
    ) {

        if (stepId === "info") {

            return [
                "domainName",
                "visitDate",
                "contactName",
                "contactPhone",
                "contactEmail",
                "estimatedPrice"
            ].some(key => filled(domain[key]));

        }

        if (stepId === "notes") {
            return filled(domain.generalNotes);
        }

        const category =
            categories.find(item => item.id === stepId);

        if (!category) return false;

        const answers =
            domain.answers &&
            typeof domain.answers === "object"
                ? domain.answers
                : {};

        const notes =
            domain.notes &&
            typeof domain.notes === "object"
                ? domain.notes
                : {};

        return category.questions.some(
            (question, index) => {
                const id = `${stepId}_${index}`;
                return (
                    filled(answers[id]) ||
                    filled(notes[id])
                );
            }
        );

    }

    window.FormSteps = {
        buildSteps,
        findQuestionStep,
        isStepComplete
    };

})();
