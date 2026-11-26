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

    window.DomainView = {
        filterDomains
    };

})();
