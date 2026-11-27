import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const html = fs.readFileSync(
    new URL("index.html", root),
    "utf8"
);

const css = fs.readFileSync(
    new URL("css/style.css", root),
    "utf8"
);

test("the step list is part of the sticky header", () => {

    const header = html.slice(
        0,
        html.indexOf("</header>")
    );

    assert.match(header, /id="formSteps"/);
    assert.match(
        css,
        /body\.form-active \.form-steps\s*\{\s*display:\s*flex/
    );

});

test("the header spans the full page on one line", () => {

    assert.match(
        css,
        /\.header-inner\s*\{[^}]*flex-direction:\s*row[^}]*flex-wrap:\s*nowrap[^}]*max-width:\s*none/s
    );

});

test("the step bar is a form-like surface inside the header", () => {

    const steps = css.slice(
        css.indexOf(".header-steps {"),
        css.indexOf(".form-step-button {")
    );

    assert.match(steps, /background:\s*var\(--background\)/);
    assert.match(steps, /border-radius:\s*14px 14px 0 0/);
    assert.match(
        css,
        /\.form-step-button\s*\{[^}]*border:\s*1px solid var\(--border\)[^}]*background:\s*var\(--card\)/s
    );

});

test("only list regions scroll inside a fixed document", () => {

    assert.match(
        css,
        /html\s*\{[^}]*height:\s*100%[^}]*overflow:\s*hidden/s
    );
    assert.match(
        css,
        /body\s*\{[^}]*overflow:\s*hidden/s
    );
    assert.match(
        css,
        /\.ranking-list,\s*\.step-content,\s*#detailContent,\s*#comparisonTable,\s*#questionPanelList\s*\{[^}]*overflow:\s*auto/s
    );
    assert.doesNotMatch(
        css,
        /\.actions\s*\{[^}]*position:\s*sticky/s
    );

});

test("each page gives its own list a scroll region", () => {

    assert.match(html, /class="card ranking-card"/);
    assert.match(html, /id="rankingList" class="ranking-list"/);
    assert.match(html, /<form id="domainEditor" class="form-editor">/);
    assert.match(html, /class="card detail-card"/);
    assert.match(html, /class="card comparison-card"/);

});

test("generated question cards join the form column directly", () => {

    assert.match(
        css,
        /#questionnaireContainer\s*\{\s*display:\s*contents/
    );

});

test("the question panel keeps its title while its list scrolls", () => {

    assert.match(
        css,
        /\.question-panel-sheet\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*overflow:\s*hidden/s
    );
    assert.match(
        css,
        /\.question-panel-header\s*\{[^}]*flex:\s*0 0 auto/s
    );
    assert.match(html, /id="questionPanelList"/);

});

test("both questionnaire views use the same reading width", () => {

    const reading = html.match(
        /class="container container-reading"/g
    );

    assert.equal(reading.length, 2);
    assert.match(css, /\.container-reading\s*\{/);

});

test("the save button submits the form beside it", () => {

    const save = html.slice(
        html.indexOf('id="btnSave"')
    );

    assert.match(
        save.slice(0, 220),
        /form="domainEditor"/
    );

});
