import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createAppServer } from "../scripts/serve.mjs";

async function withServer(options, callback) {

    const server =
        await createAppServer({
            log: false,
            ...options
        });

    await new Promise(resolve =>
        server.listen(
            0,
            "127.0.0.1",
            resolve
        )
    );

    const { port } = server.address();
    const base =
        `http://127.0.0.1:${port}`;

    try {
        await callback(base);
    } finally {
        await new Promise(resolve => {

            server.close(resolve);

            if (server.closeAllConnections) {
                server.closeAllConnections();
            }

        });
    }

}

test("the dev server injects the fixture data into index.html", async () => {

    await withServer(
        { fixtures: true },
        async base => {

            const response =
                await fetch(base + "/");

            assert.equal(
                response.status,
                200
            );

            const html =
                await response.text();

            assert.match(
                html,
                /localStorage\.setItem\("wedding-domaines:v1"/
            );

            assert.match(
                html,
                /Domaine des Cèdres/
            );

            assert.ok(
                html.indexOf("Domaine des Cèdres") <
                html.indexOf('src="js/ui.js"'),
                "injection before the app scripts"
            );

        }
    );

});

test("the injected script writes the fixtures to localStorage", async () => {

    await withServer(
        { fixtures: true },
        async base => {

            const html =
                await (
                    await fetch(base + "/")
                ).text();

            const match =
                html.match(
                    /<script>\n\(function \(\) \{[\s\S]*?\}\)\(\);\n<\/script>/
                );

            assert.ok(
                match,
                "injected script found"
            );

            const store = new Map();

            const context = {
                console,
                localStorage: {
                    setItem: (key, value) =>
                        store.set(
                            key,
                            value
                        )
                }
            };

            vm.createContext(context);

            vm.runInContext(
                match[0]
                    .replace(
                        /^<script>|<\/script>$/g,
                        ""
                    ),
                context
            );

            const saved =
                JSON.parse(
                    store.get(
                        "wedding-domaines:v1"
                    )
                );

            assert.equal(
                saved.domains.length,
                5
            );

        }
    );

});

test("the dev server can be started without fixtures", async () => {

    await withServer(
        { fixtures: false },
        async base => {

            const html =
                await (
                    await fetch(base + "/")
                ).text();

            assert.doesNotMatch(
                html,
                /Domaine des Cèdres/
            );

        }
    );

});

test("other files are served untouched", async () => {

    await withServer(
        { fixtures: true },
        async base => {

            const response =
                await fetch(
                    base + "/js/ui.js"
                );

            assert.equal(
                response.status,
                200
            );

            const script =
                await response.text();

            assert.doesNotMatch(
                script,
                /Domaine des Cèdres/
            );

        }
    );

});

test("the fixture file stays available as a static asset", async () => {

    await withServer(
        { fixtures: true },
        async base => {

            const response =
                await fetch(
                    base +
                    "/fixtures/domains.json"
                );

            assert.equal(
                response.status,
                200
            );

            const data =
                await response.json();

            assert.equal(
                data.domains.length,
                5
            );

        }
    );

});
