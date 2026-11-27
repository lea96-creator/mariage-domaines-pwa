import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const catalogue = JSON.parse(
    fs.readFileSync(
        "data/questions.json",
        "utf8"
    )
);

function loadLoader(fetchImpl) {

    const warnings = [];

    const context = {
        console: {
            warn: message =>
                warnings.push(
                    String(message)
                )
        },
        fetch: fetchImpl,
        JSON,
        Map,
        Set,
        Math,
        Object,
        Array,
        String,
        Number,
        Boolean,
        Promise,
        Error
    };

    context.window = context;

    vm.createContext(context);

    [
        "js/questions.js",
        "js/questionLoader.js"
    ].forEach(file => {

        vm.runInContext(
            fs.readFileSync(file, "utf8"),
            context
        );

    });

    return { context, warnings };

}

function jsonResponse(data, ok = true) {

    return Promise.resolve({
        ok,
        status: ok ? 200 : 404,
        json: () => Promise.resolve(data)
    });

}

test("the shipped catalogue is a valid question list", () => {

    const { context } = loadLoader(
        () => jsonResponse(catalogue)
    );

    const result =
        context.QuestionLoader.validate(
            catalogue
        );

    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.categories.length, 11);

    assert.equal(
        result.categories.reduce(
            (sum, category) =>
                sum + category.questions.length,
            0
        ),
        110
    );

});

test("loading the JSON replaces the built-in catalogue", async () => {

    const custom = {
        version: 1,
        categories: [
            {
                id: "test",
                title: "Catégorie test",
                weight: 100,
                questions: ["Une question ?"]
            }
        ]
    };

    const { context } = loadLoader(
        () => jsonResponse(custom)
    );

    const result =
        await context.QuestionLoader.load();

    assert.equal(result.source, "json");

    const categories =
        JSON.parse(
            JSON.stringify(
                context.QuestionCatalogue
                    .getCategories()
            )
        );

    assert.deepEqual(categories, custom.categories);
    assert.equal(
        context.QuestionCatalogue
            .getTotalQuestions(),
        1
    );

    assert.equal(
        context.QuestionCatalogue
            .getIndex()
            .has("test_0"),
        true
    );

});

test("a missing file falls back to the built-in catalogue", async () => {

    const { context, warnings } =
        loadLoader(
            () =>
                Promise.reject(
                    new Error("fichier absent")
                )
        );

    const result =
        await context.QuestionLoader.load();

    assert.equal(result.source, "fallback");
    assert.equal(result.errors.length, 1);

    assert.equal(
        context.QuestionCatalogue
            .getTotalQuestions(),
        110
    );

    assert.equal(warnings.length, 1);

});

test("an invalid catalogue is rejected before replacing the data", async () => {

    const invalid = {
        categories: [
            {
                id: "doublon",
                title: "Première",
                weight: 10,
                questions: ["Question ?"]
            },
            {
                id: "doublon",
                title: "Deuxième",
                weight: 10,
                questions: [""]
            }
        ]
    };

    const { context } = loadLoader(
        () => jsonResponse(invalid)
    );

    const result =
        await context.QuestionLoader.load();

    assert.equal(result.source, "fallback");
    assert.equal(
        context.QuestionCatalogue
            .getTotalQuestions(),
        110
    );

    const validation =
        context.QuestionLoader.validate(
            invalid
        );

    assert.equal(validation.valid, false);
    assert.equal(
        validation.errors.some(error =>
            error.includes("double")
        ),
        true
    );

});
