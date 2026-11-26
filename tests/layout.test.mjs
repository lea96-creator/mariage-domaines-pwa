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

test("the document is fixed and only content regions scroll", () => {

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
        /\.page-scroll\s*\{[^}]*overflow-y:\s*auto/s
    );
    assert.doesNotMatch(
        css,
        /\.actions\s*\{[^}]*position:\s*sticky/s
    );

});

test("both questionnaire views use the same reading width", () => {

    const reading = html.match(
        /class="container container-reading"/g
    );

    assert.equal(reading.length, 2);
    assert.match(css, /\.container-reading\s*\{/);

});

test("the save button submits the form beside it", () => {

    assert.match(
        html,
        /<form id="domainEditor" class="page-scroll">/
    );

    const save = html.slice(
        html.indexOf('id="btnSave"')
    );

    assert.match(
        save.slice(0, 220),
        /form="domainEditor"/
    );

});
