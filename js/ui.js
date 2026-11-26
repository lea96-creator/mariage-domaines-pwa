/*
=========================================
Wedding Domaines Planner
ui.js — une seule source de vérité
=========================================
*/

(function () {

    "use strict";

    const SVG_NS =
        "http://www.w3.org/2000/svg";

    const $ = id => document.getElementById(id);

    let editingId = null;

    /*
    =========================================
    INITIALISATION
    =========================================
    */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            loadState();

            buildQuestionnaire();
            bindEvents();
            render();

            applyShortcuts();

        }
    );

    /*
    =========================================
    NAVIGATION
    =========================================
    */

    function showPage(pageId) {

        document
            .querySelectorAll(".page")
            .forEach(page => {

                page.classList.toggle(
                    "active",
                    page.id === pageId
                );

            });

        document
            .querySelectorAll(".bottom-nav button")
            .forEach(button => {

                const active =
                    button.dataset.page === pageId;

                if (active) {
                    button.setAttribute(
                        "aria-current",
                        "page"
                    );
                } else {
                    button.removeAttribute(
                        "aria-current"
                    );
                }

            });

        window.scrollTo(0, 0);

    }

    function applyShortcuts() {

        const action =
            new URLSearchParams(
                window.location.search
            ).get("action");

        if (action === "new") {
            startNewDomain();
        } else if (action === "compare") {
            showPage("comparisonPage");
        }

        if (action) {

            try {

                window.history.replaceState(
                    null,
                    "",
                    window.location.pathname
                );

            } catch (error) {

                console.warn(
                    "Nettoyage de l'URL impossible",
                    error
                );

            }

        }

    }

    /*
    =========================================
    QUESTIONNAIRE
    =========================================
    */

    function buildQuestionnaire() {

        const container =
            $("questionnaireContainer");

        if (!container) return;

        container.replaceChildren();

        QUESTION_CATEGORIES.forEach(
            category => {

                const card =
                    document.createElement("div");

                card.className = "card";

                const heading =
                    document.createElement("h2");

                heading.textContent = category.title;
                card.appendChild(heading);

                category.questions.forEach(
                    (question, index) => {

                        const id =
                            `${category.id}_${index}`;

                        const block =
                            document.createElement("div");

                        block.className = "question";

                        const label =
                            document.createElement("label");

                        label.className =
                            "question-title";

                        label.htmlFor = `q_${id}`;
                        label.textContent = question;

                        const select =
                            document.createElement("select");

                        select.id = `q_${id}`;
                        select.className =
                            "question-answer";
                        select.dataset.question = id;

                        [
                            ["",
                                "Sélectionner"],
                            ["yes",
                                "Oui"],
                            ["partial",
                                "Partiel"],
                            ["no",
                                "Non"],
                            ["unknown",
                                "Inconnu"]
                        ].forEach(
                            ([value, text]) => {

                                const option =
                                    document.createElement(
                                        "option"
                                    );

                                option.value = value;
                                option.textContent = text;
                                select.appendChild(option);

                            }
                        );

                        const note =
                            document.createElement("textarea");

                        note.id = `n_${id}`;
                        note.className = "question-note";
                        note.dataset.note = id;
                        note.placeholder =
                            "Commentaires...";
                        note.setAttribute(
                            "aria-label",
                            `Commentaire : ${question}`
                        );

                        block.append(
                            label,
                            select,
                            note
                        );

                        card.appendChild(block);

                    }
                );

                container.appendChild(card);

            }
        );

        updateScore();

    }

    function collectAnswers() {

        const answers = {};

        document
            .querySelectorAll(".question-answer")
            .forEach(select => {

                answers[select.dataset.question] =
                    select.value;

            });

        return answers;

    }

    function collectNotes() {

        const notes = {};

        document
            .querySelectorAll(".question-note")
            .forEach(note => {

                notes[note.dataset.note] =
                    note.value;

            });

        return notes;

    }

    function updateScore() {

        const score =
            calculateDomainScore(
                collectAnswers()
            );

        const display = $("totalScore");

        if (display) {
            display.textContent =
                `${score} / 100`;
        }

    }

    /*
    =========================================
    FORMULAIRE
    =========================================
    */

    function todayISO() {

        const today = new Date();

        const month =
            String(today.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(today.getDate())
                .padStart(2, "0");

        return (
            `${today.getFullYear()}-${month}-${day}`
        );

    }

    function resetForm() {

        editingId = null;

        document
            .querySelectorAll(
                "#domainForm input," +
                "#domainForm textarea," +
                "#domainForm select"
            )
            .forEach(field => {

                field.value = "";

            });

        updateScore();

    }

    function startNewDomain() {

        resetForm();

        $("visitDate").value = todayISO();

        showPage("domainForm");

        $("domainName").focus();

    }

    function editDomain(id) {

        const domain = getDomainById(id);

        if (!domain) return;

        resetForm();

        editingId = domain.id;

        [
            "domainName",
            "visitDate",
            "contactName",
            "contactPhone",
            "contactEmail",
            "estimatedPrice",
            "generalNotes"
        ].forEach(key => {

            const field = $(key);

            if (field) {
                field.value =
                    domain[key] === null ||
                    domain[key] === undefined
                        ? ""
                        : domain[key];
            }

        });

        QUESTION_INDEX.forEach(
            (entry, questionId) => {

                const select =
                    $(`q_${questionId}`);

                const note =
                    $(`n_${questionId}`);

                if (select) {
                    select.value =
                        domain.answers[questionId] || "";
                }

                if (note) {
                    note.value =
                        domain.notes[questionId] || "";
                }

            }
        );

        updateScore();
        showPage("domainForm");

        $("domainName").focus();

    }

    function saveDomainFromForm() {

        const form = $("domainEditor");

        if (
            form &&
            typeof form.reportValidity === "function" &&
            !form.reportValidity()
        ) {
            return;
        }

        const existing = editingId
            ? getDomainById(editingId)
            : null;

        upsertDomain({
            id: editingId || undefined,
            domainName: $("domainName").value,
            visitDate: $("visitDate").value,
            contactName: $("contactName").value,
            contactPhone: $("contactPhone").value,
            contactEmail: $("contactEmail").value,
            estimatedPrice: $("estimatedPrice").value,
            answers: collectAnswers(),
            notes: collectNotes(),
            generalNotes: $("generalNotes").value,
            createdAt: existing
                ? existing.createdAt
                : undefined
        });

        const saved = persistState();

        editingId = null;
        render();
        showPage("dashboard");

        showToast(
            saved
                ? "Domaine enregistré"
                : "Enregistré pour cette session seulement (stockage indisponible)",
            saved ? "success" : "error"
        );

    }

    function removeDomain(id) {

        const domain = getDomainById(id);

        if (!domain) return;

        const name =
            domain.domainName || "Sans nom";

        if (
            !window.confirm(
                `Supprimer « ${name} » ? Cette action est irréversible.`
            )
        ) {
            return;
        }

        deleteDomainById(id);
        render();

        showToast(`« ${name} » supprimé`);

    }

    /*
    =========================================
    RENDU
    =========================================
    */

    function sortedDomains() {

        return [...getState().domains]
            .sort(
                (a, b) =>
                    calculateDomainScore(b.answers)
                    - calculateDomainScore(a.answers)
            );

    }

    function render() {

        renderStats();
        renderRanking();
        renderComparison();

    }

    function renderStats() {

        const domains = getState().domains;
        const sorted = sortedDomains();
        const best = sorted[0];

        $("totalDomains").textContent =
            domains.length;

        $("bestScore").textContent =
            best
                ? calculateDomainScore(best.answers)
                : 0;

        $("favoriteDomain").textContent =
            best
                ? best.domainName || "Sans nom"
                : "-";

    }

    function iconButton(iconId, label, action, domainId) {

        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "btn-icon";
        button.title = label;
        button.setAttribute(
            "aria-label",
            label
        );

        button.dataset.action = action;
        button.dataset.id = domainId;

        const svg =
            document.createElementNS(
                SVG_NS,
                "svg"
            );

        svg.setAttribute(
            "class",
            "icon"
        );

        svg.setAttribute(
            "aria-hidden",
            "true"
        );

        svg.setAttribute(
            "focusable",
            "false"
        );

        const use =
            document.createElementNS(
                SVG_NS,
                "use"
            );

        use.setAttribute(
            "href",
            `#${iconId}`
        );

        svg.appendChild(use);
        button.appendChild(svg);

        return button;

    }

    function renderRanking() {

        const list = $("rankingList");

        if (!list) return;

        list.replaceChildren();

        const ranked = sortedDomains();

        if (ranked.length === 0) {

            const empty =
                document.createElement("div");

            empty.className = "empty-state";
            empty.textContent =
                "Aucun domaine enregistré";

            list.appendChild(empty);
            return;

        }

        const search = $("domainSearch");
        const query =
            search ? search.value : "";

        const visible =
            DomainView.filterDomains(
                ranked,
                query
            );

        if (visible.length === 0) {

            const empty =
                document.createElement("div");

            empty.className = "empty-state";
            empty.textContent =
                "Aucun domaine ne correspond à la recherche.";

            list.appendChild(empty);
            return;

        }

        const ranks = new Map(
            ranked.map(
                (domain, index) =>
                    [domain.id, index + 1]
            )
        );

        visible.forEach(
            domain => {

                const item =
                    document.createElement("div");

                item.className = "ranking-item";

                const label =
                    document.createElement("div");

                label.className = "ranking-label";
                label.textContent =
                    `${ranks.get(domain.id)}. ${
                        domain.domainName || "Sans nom"
                    }`;

                const right =
                    document.createElement("div");

                right.className = "ranking-right";

                const score =
                    document.createElement("span");

                score.className = "ranking-score";
                score.textContent =
                    `${calculateDomainScore(domain.answers)}/100`;

                const name =
                    domain.domainName || "ce domaine";

                const edit =
                    iconButton(
                        "i-edit",
                        `Modifier ${name}`,
                        "edit",
                        domain.id
                    );

                const remove =
                    iconButton(
                        "i-delete",
                        `Supprimer ${name}`,
                        "delete",
                        domain.id
                    );

                right.append(
                    score,
                    edit,
                    remove
                );

                item.append(
                    label,
                    right
                );

                list.appendChild(item);

            }
        );

    }

    function renderComparison() {

        const container =
            $("comparisonTable");

        if (!container) return;

        container.replaceChildren();

        const domains = sortedDomains();

        if (domains.length === 0) {

            const empty =
                document.createElement("div");

            empty.className = "empty-state";
            empty.textContent =
                "Aucun domaine à comparer";

            container.appendChild(empty);
            return;

        }

        const table =
            document.createElement("table");

        const head =
            document.createElement("thead");

        const headRow =
            document.createElement("tr");

        [
            "Domaine",
            "Score",
            "Prix",
            "Date visite",
            "Contact"
        ].forEach(title => {

            const cell =
                document.createElement("th");

            cell.scope = "col";
            cell.textContent = title;
            headRow.appendChild(cell);

        });

        head.appendChild(headRow);

        const body =
            document.createElement("tbody");

        domains.forEach(domain => {

            const row =
                document.createElement("tr");

            const values = [
                domain.domainName || "Sans nom",
                `${calculateDomainScore(domain.answers)}/100`,
                domain.estimatedPrice === null
                    ? "-"
                    : `${domain.estimatedPrice} €`,
                domain.visitDate || "-",
                domain.contactName || "-"
            ];

            values.forEach(value => {

                const cell =
                    document.createElement("td");

                cell.textContent = value;
                row.appendChild(cell);

            });

            body.appendChild(row);

        });

        table.append(
            head,
            body
        );

        container.appendChild(table);

    }


    function exportExcel() {

        try {

            exportDomainsToExcel(
                getState().domains
            );

            showToast(
                "Export Excel généré"
            );

        } catch (error) {

            showToast(
                `Erreur : ${error.message}`,
                "error"
            );

        }

    }

    /*
    =========================================
    ÉVÉNEMENTS
    =========================================
    */

    function bindEvents() {

        Transfer.init({
            onMessage: showToast,
            onImported: render
        });

        document
            .querySelectorAll(
                ".bottom-nav button"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => showPage(button.dataset.page)
                );

            });

        $("btnNewDomain").addEventListener(
            "click",
            startNewDomain
        );

        $("btnBack").addEventListener(
            "click",
            () => showPage("dashboard")
        );

        $("domainEditor").addEventListener(
            "submit",
            event => {

                event.preventDefault();
                saveDomainFromForm();

            }
        );

        $("questionnaireContainer")
            .addEventListener(
                "change",
                event => {

                    if (
                        event.target.matches(
                            ".question-answer"
                        )
                    ) {
                        updateScore();
                    }

                }
            );

        const search = $("domainSearch");

        if (search) {
            search.addEventListener(
                "input",
                renderRanking
            );
        }

        $("rankingList")
            .addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "button[data-action]"
                        );

                    if (!button) return;

                    if (button.dataset.action === "edit") {
                        editDomain(button.dataset.id);
                    } else if (
                        button.dataset.action === "delete"
                    ) {
                        removeDomain(button.dataset.id);
                    }

                }
            );

        $("btnExportExcel").addEventListener(
            "click",
            exportExcel
        );

        $("btnBackup").addEventListener(
            "click",
            Transfer.exportBackupFile
        );

        $("btnRestore").addEventListener(
            "click",
            () => $("importFile").click()
        );

        $("importFile").addEventListener(
            "change",
            event =>
                Transfer.importBackupFile(
                    event.target
                )
        );

    }

    /*
    =========================================
    NOTIFICATIONS
    =========================================
    */

    function showToast(message, type = "success") {

        const layer =
            $("notificationLayer");

        if (!layer) return;

        const kind =
            ["success", "error", "info"]
                .includes(type)
                ? type
                : "info";

        const notification =
            document.createElement("div");

        notification.className = "notification";
        notification.dataset.type = kind;
        notification.textContent = message;

        layer.appendChild(notification);

        while (layer.children.length > 3) {
            layer.firstElementChild.remove();
        }

        window.requestAnimationFrame(
            () => {
                notification.dataset.visible =
                    "true";
            }
        );

        window.setTimeout(
            () => {

                notification.dataset.visible =
                    "false";

                window.setTimeout(
                    () => notification.remove(),
                    250
                );

            },
            4000
        );

    }

})();
