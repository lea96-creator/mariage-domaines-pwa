import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function loadDomainView() {

    const context = {
        console,
        String,
        Number,
        Object,
        Array,
        Set,
        Map,
        Math,
        Date
    };

    context.window = context;

    vm.createContext(context);

    [
        "js/questions.js",
        "js/domainView.js"
    ].forEach(file => {

        vm.runInContext(
            fs.readFileSync(file, "utf8"),
            context
        );

    });

    return context.DomainView;

}

const domains = [
    {
        domainName: "Domaine des Cèdres",
        contactName: "Alice Martin",
        contactPhone: "",
        contactEmail: "",
        generalNotes: ""
    },
    {
        domainName: "Le Grand Pré",
        contactName: "Bob Bernard",
        contactPhone: "0612345678",
        contactEmail: "bob@example.test",
        generalNotes: "Très bon accueil"
    }
];

test("an empty query keeps every domain", () => {

    const { filterDomains } = loadDomainView();

    assert.equal(
        filterDomains(domains, "").length,
        2
    );

    assert.equal(
        filterDomains(domains, "   ").length,
        2
    );

});

test("search ignores accents and case", () => {

    const { filterDomains } = loadDomainView();

    const result =
        filterDomains(domains, "cedres");

    assert.equal(result.length, 1);
    assert.equal(
        result[0].domainName,
        "Domaine des Cèdres"
    );

});

test("search also finds contact details and notes", () => {

    const { filterDomains } = loadDomainView();

    assert.equal(
        filterDomains(domains, "bob")[0].domainName,
        "Le Grand Pré"
    );

    assert.equal(
        filterDomains(domains, "0612")[0].domainName,
        "Le Grand Pré"
    );

    assert.equal(
        filterDomains(domains, "accueil")[0].domainName,
        "Le Grand Pré"
    );

});

test("unmatched search returns an empty list", () => {

    const { filterDomains } = loadDomainView();

    assert.deepEqual(
        filterDomains(domains, "inconnu"),
        []
    );

});

test("only filled information is kept", () => {

    const { filledInfo } = loadDomainView();

    const result = filledInfo({
        domainName: "Domaine test",
        visitDate: "",
        contactName: "  Alice  ",
        contactPhone: "",
        contactEmail: "",
        estimatedPrice: 0,
        generalNotes: ""
    });

    assert.deepEqual(
        JSON.parse(JSON.stringify(result)),
        [
            {
                label: "Nom",
                value: "Domaine test"
            },
            {
                label: "Contact",
                value: "Alice"
            },
            {
                label: "Prix annoncé",
                value: "0 €"
            }
        ]
    );

});

test("only answered questions are shown", () => {

    const { filledAnswers } = loadDomainView();

    const result = filledAnswers({
        answers: {
            disponibilites_0: "yes",
            disponibilites_1: "unknown",
            hebergement_0: ""
        },
        notes: {
            disponibilites_1: "À revérifier",
            hebergement_0: "Note seule"
        }
    });

    assert.deepEqual(
        JSON.parse(JSON.stringify(result)),
        [
            {
                title:
                    "Disponibilités et privatisation",
                questions: [
                    {
                        question:
                            "La date souhaitée est-elle disponible ?",
                        answer: "Oui",
                        note: ""
                    },
                    {
                        question:
                            "Le domaine est-il privatisé du vendredi au lundi ?",
                        answer: "Inconnu",
                        note: "À revérifier"
                    }
                ]
            },
            {
                title: "Hébergements",
                questions: [
                    {
                        question:
                            "Nombre de couchages suffisant ?",
                        answer: "",
                        note: "Note seule"
                    }
                ]
            }
        ]
    );

});
