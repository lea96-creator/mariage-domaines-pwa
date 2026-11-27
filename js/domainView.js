/*
=========================================
Wedding Domaines Planner
domainView.js — recherche et lecture
=========================================
*/

(function () {

    "use strict";

    function normalize(value) {

        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    }

    function filterDomains(domains = [], query = "") {

        const needle = normalize(query);

        if (!needle) {
            return [...domains];
        }

        return domains.filter(domain => {

            const text = [
                domain.domainName,
                domain.contactName,
                domain.contactPhone,
                domain.contactEmail,
                domain.generalNotes
            ]
                .map(normalize)
                .join(" ");

            return text.includes(needle);

        });

    }

    function filledInfo(domain) {

        const source =
            domain && typeof domain === "object"
                ? domain
                : {};

        const price =
            source.estimatedPrice === null ||
            source.estimatedPrice === undefined
                ? ""
                : `${source.estimatedPrice} €`;

        return [
            ["Nom", source.domainName],
            ["Date de visite", source.visitDate],
            ["Contact", source.contactName],
            ["Téléphone", source.contactPhone],
            ["Email", source.contactEmail],
            ["Prix annoncé", price],
            ["Notes générales", source.generalNotes]
        ]
            .filter(([, value]) =>
                String(value || "").trim() !== ""
            )
            .map(([label, value]) => ({
                label,
                value: String(value).trim()
            }));

    }

    function filledAnswers(domain) {

        const source =
            domain && typeof domain === "object"
                ? domain
                : {};

        const answers =
            source.answers &&
            typeof source.answers === "object"
                ? source.answers
                : {};

        const notes =
            source.notes &&
            typeof source.notes === "object"
                ? source.notes
                : {};

        return QUESTION_CATEGORIES
            .map(category => {

                const questions = [];

                category.questions.forEach(
                    (question, index) => {

                        const id =
                            `${category.id}_${index}`;

                        const answer =
                            ANSWER_LABELS[answers[id]] || "";

                        const note =
                            String(notes[id] || "").trim();

                        if (!answer && !note) {
                            return;
                        }

                        questions.push({
                            question,
                            answer,
                            note
                        });

                    }
                );

                return questions.length
                    ? {
                        title: category.title,
                        questions
                    }
                    : null;

            })
            .filter(Boolean);

    }

    window.DomainView = {
        filterDomains,
        filledInfo,
        filledAnswers
    };

})();
