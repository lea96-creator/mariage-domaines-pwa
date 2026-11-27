import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function loadFormSteps() {

    const context = {
        console,
        String,
        Number,
        Object,
        Array,
        Boolean
    };

    context.window = context;

    vm.createContext(context);

    [
        "js/questions.js",
        "js/formSteps.js"
    ].forEach(file => {

        vm.runInContext(
            fs.readFileSync(file, "utf8"),
            context
        );

    });

    return context.FormSteps;

}

const categories = [
    {
        id: "disponibilites",
        title: "Disponibilités",
        questions: ["Date disponible ?", "Option possible ?"]
    },
    {
        id: "tarifs",
        title: "Budget",
        questions: ["Tarif cohérent ?"]
    }
];

test("steps wrap the info and notes pages around each category", () => {

    const { buildSteps } = loadFormSteps();

    const steps = buildSteps(categories);

    assert.deepEqual(
        JSON.parse(
            JSON.stringify(
                steps.map(step => step.id)
            )
        ),
        ["info", "disponibilites", "tarifs", "notes"]
    );

    assert.equal(steps[0].title, "Informations");
    assert.equal(steps[3].title, "Notes et score");

});

test("a question finds its category step", () => {

    const { findQuestionStep } = loadFormSteps();

    assert.equal(
        findQuestionStep(categories, "tarifs_0"),
        "tarifs"
    );

    assert.equal(
        findQuestionStep(categories, "inconnu_0"),
        null
    );

});

test("a step is complete when it has at least one value", () => {

    const { isStepComplete } = loadFormSteps();

    assert.equal(
        isStepComplete("info", categories, {
            domainName: "Domaine test"
        }),
        true
    );

    assert.equal(
        isStepComplete("info", categories, {
            domainName: "   "
        }),
        false
    );

    assert.equal(
        isStepComplete(
            "disponibilites",
            categories,
            {
                answers: {
                    disponibilites_1: "yes"
                },
                notes: {}
            }
        ),
        true
    );

    assert.equal(
        isStepComplete(
            "disponibilites",
            categories,
            {
                answers: {},
                notes: {
                    disponibilites_0: "À revérifier"
                }
            }
        ),
        true
    );

    assert.equal(
        isStepComplete(
            "tarifs",
            categories,
            {
                answers: {},
                notes: {}
            }
        ),
        false
    );

    assert.equal(
        isStepComplete("notes", categories, {
            generalNotes: "Bonne visite"
        }),
        true
    );

});
