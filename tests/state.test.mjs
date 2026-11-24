import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function loadCore(seed = null) {

    const store = new Map();

    if (seed) {
        store.set(
            "wedding-domaines:v1",
            JSON.stringify(seed)
        );
    }

    const context = {
        console,
        crypto: globalThis.crypto,
        Date,
        Math,
        JSON,
        Number,
        String,
        Object,
        Array,
        Set,
        Map
    };

    context.localStorage = {
        getItem: key => store.has(key) ? store.get(key) : null,
        setItem: (key, value) => store.set(key, String(value))
    };

    vm.createContext(context);

    [
        "js/questions.js",
        "js/store.js"
    ].forEach(file => {

        vm.runInContext(
            fs.readFileSync(file, "utf8"),
            context
        );

    });

    vm.runInContext("loadState();", context);

    const api = vm.runInContext(
        `({
            TOTAL_QUESTIONS,
            TOTAL_WEIGHT,
            QUESTION_CATEGORIES,
            QUESTION_INDEX,
            calculateDomainScore,
            getState,
            getDomainById,
            upsertDomain,
            deleteDomainById,
            buildBackup,
            parseBackup,
            mergeBackup
        })`,
        context
    );

    return { api, store };

}

function allAnswers(api, value) {

    return Object.fromEntries(
        [...api.QUESTION_INDEX.keys()]
            .map(id => [id, value])
    );

}

test("catalogue and weights", () => {

    const { api } = loadCore();

    assert.equal(api.TOTAL_QUESTIONS, 110);
    assert.equal(api.TOTAL_WEIGHT, 100);
    assert.equal(
        api.QUESTION_CATEGORIES.length,
        11
    );

});

test("weighted score semantics", () => {

    const { api } = loadCore();

    const score = api.calculateDomainScore;

    assert.equal(
        score(allAnswers(api, "yes")),
        100
    );

    assert.equal(
        score(allAnswers(api, "partial")),
        50
    );

    assert.equal(
        score(allAnswers(api, "no")),
        0
    );

    assert.equal(
        score(allAnswers(api, "unknown")),
        0
    );

    assert.equal(
        score({
            disponibilites_0: "yes",
            disponibilites_1: "unknown"
        }),
        100
    );

    assert.equal(score({}), 0);

});

test("create, read, update, delete", () => {

    const { api } = loadCore();

    const domain = api.upsertDomain({
        domainName: "Domaine test",
        estimatedPrice: "1250,50",
        answers: { disponibilites_0: "yes" }
    });

    assert.ok(domain.id);
    assert.equal(domain.estimatedPrice, 1250.5);
    assert.equal(api.getState().domains.length, 1);

    api.upsertDomain({
        ...domain,
        domainName: "Domaine modifié"
    });

    assert.equal(api.getState().domains.length, 1);
    assert.equal(
        api.getState().domains[0].domainName,
        "Domaine modifié"
    );

    assert.equal(
        api.deleteDomainById(domain.id),
        true
    );

    assert.equal(api.getState().domains.length, 0);

});

test("unexpected values are sanitized", () => {

    const { api } = loadCore();

    const domain = api.upsertDomain({
        domainName: "  Domaine  ",
        estimatedPrice: "pas un prix",
        answers: {
            disponibilites_0: "yes",
            inconnu_99: "yes",
            disponibilites_1: "hack"
        },
        notes: { inconnu_99: "à ignorer" }
    });

    assert.equal(domain.domainName, "Domaine");
    assert.equal(domain.estimatedPrice, null);
    assert.deepEqual(
        JSON.parse(JSON.stringify(domain.answers)),
        { disponibilites_0: "yes" }
    );
    assert.deepEqual(
        JSON.parse(JSON.stringify(domain.notes)),
        {}
    );

});

test("backup round trip and merge by id", () => {

    const { api } = loadCore();

    api.upsertDomain({
        id: "a",
        domainName: "Domaine A"
    });

    const backup = api.buildBackup();

    assert.equal(backup.version, 1);
    assert.equal(backup.domains.length, 1);

    const parsed = api.parseBackup(
        JSON.stringify(backup)
    );

    assert.equal(parsed.domains.length, 1);

    const result = api.mergeBackup({
        domains: [
            { id: "a", domainName: "A modifié" },
            { id: "b", domainName: "Domaine B" }
        ]
    });

    assert.deepEqual(
        JSON.parse(JSON.stringify(result)),
        { added: 1, updated: 1 }
    );

    assert.equal(
        api.getState().domains.length,
        2
    );

    assert.equal(
        api.getDomainById("a").domainName,
        "A modifié"
    );

});

test("invalid backup files are rejected", () => {

    const { api } = loadCore();

    assert.throws(
        () => api.parseBackup("pas du json"),
        /JSON valide/
    );

    assert.throws(
        () => api.parseBackup('{"foo":1}'),
        /Aucune liste de domaines/
    );

});

test("state survives a reload", () => {

    const first = loadCore();

    first.api.upsertDomain({
        id: "persistant",
        domainName: "Domaine persistant"
    });

    const second = loadCore(
        JSON.parse(
            first.store.get("wedding-domaines:v1")
        )
    );

    assert.equal(
        second.api.getState().domains.length,
        1
    );

    assert.equal(
        second.api.getState().domains[0].domainName,
        "Domaine persistant"
    );

});
