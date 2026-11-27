/*
=========================================
Wedding Domaines Planner
questionLoader.js — catalogue JSON
=========================================
*/

(function () {

    "use strict";

    const CATALOGUE_URL = "./data/questions.json";

    function validate(data) {

        const errors = [];

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            return {
                valid: false,
                errors: ["Fichier JSON invalide"],
                categories: []
            };
        }

        const source = data.categories;

        if (
            !Array.isArray(source) ||
            source.length === 0
        ) {
            return {
                valid: false,
                errors: [
                    "Aucune catégorie de questions"
                ],
                categories: []
            };
        }

        const seen = new Set();
        const categories = [];

        source.forEach(
            (item, position) => {

                const label =
                    `catégorie ${position + 1}`;

                if (
                    !item ||
                    typeof item !== "object" ||
                    Array.isArray(item)
                ) {
                    errors.push(
                        `${label} : objet attendu`
                    );
                    return;
                }

                const id =
                    String(item.id || "").trim();

                const title =
                    String(item.title || "").trim();

                const weight = Number(item.weight);

                const rawQuestions =
                    Array.isArray(item.questions)
                        ? item.questions
                        : [];

                const questions =
                    rawQuestions
                        .map(question =>
                            String(
                                question || ""
                            ).trim()
                        )
                        .filter(Boolean);

                const idOk =
                    /^[A-Za-z][A-Za-z0-9_-]*$/.test(
                        id
                    );

                let unique = false;

                if (!idOk) {
                    errors.push(
                        `${label} : identifiant invalide`
                    );
                } else if (seen.has(id)) {
                    errors.push(
                        `${label} : identifiant en double`
                    );
                } else {
                    seen.add(id);
                    unique = true;
                }

                if (!title) {
                    errors.push(
                        `${label} : titre manquant`
                    );
                }

                if (
                    !Number.isFinite(weight) ||
                    weight <= 0
                ) {
                    errors.push(
                        `${label} : poids invalide`
                    );
                }

                if (
                    !questions.length ||
                    questions.length !==
                        rawQuestions.length
                ) {
                    errors.push(
                        `${label} : questions invalides`
                    );
                }

                if (
                    idOk &&
                    unique &&
                    title &&
                    Number.isFinite(weight) &&
                    weight > 0 &&
                    questions.length &&
                    questions.length ===
                        rawQuestions.length
                ) {
                    categories.push({
                        id,
                        title,
                        weight,
                        questions
                    });
                }

            }
        );

        return {
            valid: errors.length === 0,
            errors,
            categories
        };

    }

    async function load(url = CATALOGUE_URL) {

        try {

            const response =
                await fetch(url, {
                    cache: "no-store"
                });

            if (!response || !response.ok) {
                throw new Error(
                    `Fichier indisponible (${response ? response.status : "réseau"})`
                );
            }

            const data = await response.json();
            const result = validate(data);

            if (!result.valid) {
                throw new Error(
                    result.errors.join(" ; ")
                );
            }

            if (window.QuestionCatalogue) {
                window.QuestionCatalogue
                    .setCategories(
                        result.categories
                    );
            }

            return {
                source: "json",
                categories: result.categories,
                errors: []
            };

        } catch (error) {

            const message =
                error && error.message
                    ? error.message
                    : String(error);

            console.warn(
                "Catalogue de questions indisponible, version intégrée utilisée",
                message
            );

            const fallback =
                window.QuestionCatalogue
                    ? window.QuestionCatalogue.defaults
                    : [];

            if (window.QuestionCatalogue) {
                window.QuestionCatalogue
                    .setCategories(fallback);
            }

            return {
                source: "fallback",
                categories: fallback,
                errors: [message]
            };

        }

    }

    window.QuestionLoader = {
        CATALOGUE_URL,
        validate,
        load
    };

})();
