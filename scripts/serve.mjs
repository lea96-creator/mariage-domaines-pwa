/*
=========================================
Wedding Domaines Planner
scripts/serve.mjs — serveur local sans dépendance
=========================================
Node >= 18, aucun npm install nécessaire.

Le serveur de dev injecte les domaines fictifs
dans index.html avant le chargement de l'app.
Rien de tout cela n'est publié avec le site.
=========================================
*/

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import {
    basename,
    extname,
    join,
    normalize,
    resolve,
    sep
} from "node:path";
import {
    fileURLToPath,
    pathToFileURL
} from "node:url";

const ROOT =
    resolve(
        fileURLToPath(
            new URL("..", import.meta.url)
        )
    );

const PORT =
    Number(process.env.PORT) || 8080;

const FIXTURES_FILE =
    resolve(ROOT, "fixtures/domains.json");

const STORAGE_KEY =
    "wedding-domaines:v1";

const MIME = {
    ".html":
        "text/html; charset=utf-8",
    ".css":
        "text/css; charset=utf-8",
    ".js":
        "text/javascript; charset=utf-8",
    ".mjs":
        "text/javascript; charset=utf-8",
    ".json":
        "application/json; charset=utf-8",
    ".png":
        "image/png",
    ".svg":
        "image/svg+xml",
    ".ico":
        "image/x-icon"
};

function safePath(pathname) {

    let decoded;

    try {
        decoded =
            decodeURIComponent(pathname);
    } catch {
        return null;
    }

    const clean =
        normalize(decoded);

    const target =
        resolve(join(ROOT, clean));

    if (
        target !== ROOT &&
        !target.startsWith(ROOT + sep)
    ) {
        return null;
    }

    return target;

}

function fixtureScript(domains) {

    const payload =
        JSON.stringify({
            version: 1,
            domains
        })
            .replace(/</g, "\\u003c");

    return [
        "<script>",
        "(function () {",
        "try {",
        `localStorage.setItem("${STORAGE_KEY}", ${JSON.stringify(payload)});`,
        "} catch (error) {",
        'console.warn("Fixtures de dev indisponibles", error);',
        "}",
        "})();",
        "</script>"
    ].join("\n");

}

function injectFixtures(html, script) {

    if (!html.includes("</head>")) {
        return html;
    }

    return html.replace(
        "</head>",
        `${script}\n</head>`
    );

}

export async function createAppServer(
    { fixtures = true, log = true } = {}
) {

    let injection = "";

    if (fixtures) {

        const raw =
            await readFile(
                FIXTURES_FILE,
                "utf8"
            );

        const data =
            JSON.parse(raw);

        const domains =
            Array.isArray(data.domains)
                ? data.domains
                : [];

        injection =
            fixtureScript(domains);

    }

    return createServer(
        async (request, response) => {

            try {

                const url =
                    new URL(
                        request.url,
                        `http://${
                            request.headers.host ||
                            "localhost"
                        }`
                    );

                let target =
                    safePath(url.pathname);

                if (!target) {

                    response.writeHead(400);
                    response.end(
                        "Requête invalide"
                    );

                    return;

                }

                let info = null;

                try {
                    info =
                        await stat(target);
                } catch {
                    info = null;
                }

                if (
                    info &&
                    info.isDirectory()
                ) {

                    target =
                        join(
                            target,
                            "index.html"
                        );

                } else if (!info) {

                    const accept =
                        request.headers.accept || "";

                    if (
                        accept.includes(
                            "text/html"
                        )
                    ) {

                        target =
                            join(
                                ROOT,
                                "index.html"
                            );

                    } else {

                        response.writeHead(404);
                        response.end(
                            "Fichier introuvable"
                        );

                        return;

                    }

                }

                let body =
                    await readFile(target);

                if (
                    injection &&
                    extname(target).toLowerCase() ===
                        ".html" &&
                    basename(target) ===
                        "index.html"
                ) {

                    body =
                        Buffer.from(
                            injectFixtures(
                                body.toString("utf8"),
                                injection
                            )
                        );

                }

                const type =
                    MIME[
                        extname(target).toLowerCase()
                    ] ||
                    "application/octet-stream";

                response.writeHead(200, {
                    "Content-Type": type,
                    "Cache-Control":
                        "no-store"
                });

                response.end(body);

                if (log) {
                    console.log(
                        `${request.method} ${
                            url.pathname
                        } -> ${
                            target.startsWith(ROOT)
                                ? "."
                                + target.slice(ROOT.length)
                                : target
                        }`
                    );
                }

            } catch (error) {

                console.error(error);

                response.writeHead(500);
                response.end(
                    "Erreur du serveur"
                );

            }

        }
    );

}

const directRun =
    process.argv[1] &&
    import.meta.url ===
        pathToFileURL(process.argv[1]).href;

if (directRun) {

    const fixtures =
        process.env.FIXTURES !== "0";

    createAppServer({ fixtures })
        .then(server => {

            server.listen(
                PORT,
                () => {

                    console.log(
                        "Wedding Domaines Planner : "
                        + `http://localhost:${PORT}`
                        + (
                            fixtures
                                ? " (données fictives chargées)"
                                : ""
                        )
                    );

                }
            );

        })
        .catch(error => {

            console.error(error);
            process.exitCode = 1;

        });

}
