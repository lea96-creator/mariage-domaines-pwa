/*
=========================================
Wedding Domaines Planner
scripts/serve.mjs — serveur local sans dépendance
=========================================
Node >= 18, aucun npm install nécessaire.
=========================================
*/

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import {
    extname,
    join,
    normalize,
    resolve,
    sep
} from "node:path";
import { fileURLToPath } from "node:url";

const ROOT =
    resolve(
        fileURLToPath(
            new URL("..", import.meta.url)
        )
    );

const PORT =
    Number(process.env.PORT) || 8080;

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

const server =
    createServer(
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

                if (info && info.isDirectory()) {

                    target =
                        join(target, "index.html");

                } else if (!info) {

                    const accept =
                        request.headers.accept || "";

                    if (
                        accept.includes("text/html")
                    ) {
                        target =
                            join(ROOT, "index.html");
                    } else {

                        response.writeHead(404);
                        response.end(
                            "Fichier introuvable"
                        );

                        return;

                    }

                }

                const body =
                    await readFile(target);

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

            } catch (error) {

                console.error(error);

                response.writeHead(500);
                response.end(
                    "Erreur du serveur"
                );

            }

        }
    );

server.listen(
    PORT,
    () => {

        console.log(
            `Wedding Domaines Planner : http://localhost:${PORT}`
        );

    }
);
