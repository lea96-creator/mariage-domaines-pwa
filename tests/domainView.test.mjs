import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function loadDomainView() {

    const context = {
        console,
        String,
        Array
    };

    context.window = context;

    vm.createContext(context);

    vm.runInContext(
        fs.readFileSync(
            "js/domainView.js",
            "utf8"
        ),
        context
    );

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
