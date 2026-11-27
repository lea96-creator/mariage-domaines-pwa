import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function element() {

    const attributes = new Map();
    const listeners = new Map();

    return {
        attributes,
        setAttribute(name, value) {
            attributes.set(name, String(value));
        },
        getAttribute(name) {
            return attributes.has(name)
                ? attributes.get(name)
                : null;
        },
        addEventListener(type, handler) {
            if (!listeners.has(type)) {
                listeners.set(type, []);
            }
            listeners.get(type).push(handler);
        },
        click() {
            (listeners.get("click") || [])
                .forEach(handler => handler({}));
        }
    };

}

function loadTheme({ stored = null } = {}) {

    const html = element();
    const button = element();
    const meta = element();
    const store = new Map();

    if (stored !== null) {
        store.set(
            "wedding-domaines:theme",
            stored
        );
    }

    let systemHandler = null;

    const query = {
        addEventListener(type, handler) {
            if (type === "change") {
                systemHandler = handler;
            }
        }
    };

    const context = {
        console,
        String,
        Boolean,
        Object,
        Error,
        localStorage: {
            getItem: key =>
                store.has(key) ? store.get(key) : null,
            setItem: (key, value) =>
                store.set(key, String(value))
        },
        document: {
            documentElement: html,
            getElementById: id => {
                if (id === "btnTheme") return button;
                if (id === "themeColor") return meta;
                return null;
            },
            addEventListener() {}
        }
    };

    context.window = context;
    context.window.matchMedia = () => query;

    vm.createContext(context);

    vm.runInContext(
        fs.readFileSync("js/theme.js", "utf8"),
        context
    );

    return {
        Theme: context.Theme,
        html,
        button,
        meta,
        store,
        systemChange: matches => {
            if (systemHandler) {
                systemHandler({ matches });
            }
        }
    };

}

test("applying a theme updates the page and can remember the choice", () => {

    const { Theme, html, button, meta, store } =
        loadTheme();

    assert.equal(Theme.current(), "light");

    assert.equal(
        Theme.setTheme("dark", true),
        "dark"
    );

    assert.equal(
        html.getAttribute("data-theme"),
        "dark"
    );
    assert.equal(Theme.current(), "dark");

    assert.equal(
        button.getAttribute("aria-pressed"),
        "true"
    );
    assert.equal(
        button.getAttribute("aria-label"),
        "Activer le thème clair"
    );
    assert.equal(
        meta.getAttribute("content"),
        "#262421"
    );
    assert.equal(
        store.get("wedding-domaines:theme"),
        "dark"
    );

    Theme.setTheme("light");

    assert.equal(
        html.getAttribute("data-theme"),
        "light"
    );
    assert.equal(
        button.getAttribute("aria-pressed"),
        "false"
    );
    assert.equal(
        meta.getAttribute("content"),
        "#8b5e3c"
    );

});

test("the header button toggles and stores the new theme", () => {

    const { Theme, button, store } =
        loadTheme({ stored: "light" });

    Theme.init();

    assert.equal(
        button.getAttribute("aria-label"),
        "Activer le thème sombre"
    );

    button.click();

    assert.equal(Theme.current(), "dark");
    assert.equal(
        store.get("wedding-domaines:theme"),
        "dark"
    );

    button.click();

    assert.equal(Theme.current(), "light");
    assert.equal(
        store.get("wedding-domaines:theme"),
        "light"
    );

});

test("system changes apply only until a manual choice exists", () => {

    const automatic = loadTheme();

    automatic.Theme.init();
    automatic.systemChange(true);

    assert.equal(
        automatic.Theme.current(),
        "dark"
    );

    automatic.systemChange(false);

    assert.equal(
        automatic.Theme.current(),
        "light"
    );

    const manual = loadTheme({ stored: "light" });

    manual.Theme.init();
    manual.systemChange(true);

    assert.equal(
        manual.Theme.current(),
        "light"
    );

});
