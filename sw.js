/*
=========================================
Wedding Domaines Planner
Service Worker v2
=========================================
À incrémenter à chaque déploiement : la
nouvelle version supprime l'ancien cache.
=========================================
*/

const CACHE_VERSION = "v2.8.0";
const CACHE_NAME = `wedding-domaines-${CACHE_VERSION}`;

const APP_ASSETS = [

    "./",
    "./index.html",

    "./manifest.json",
    "./css/style.css",
    "./data/questions.json",

    "./js/questions.js",
    "./js/questionLoader.js",
    "./js/theme.js",
    "./js/store.js",
    "./js/domainView.js",
    "./js/formSteps.js",
    "./js/excelExport.js",
    "./js/transfer.js",
    "./js/ui.js",
    "./js/vendor/xlsx.full.min.js",

    "./icons/icon-72.png",
    "./icons/icon-96.png",
    "./icons/icon-128.png",
    "./icons/icon-144.png",
    "./icons/icon-152.png",
    "./icons/icon-192.png",
    "./icons/icon-384.png",
    "./icons/icon-512.png"

];

function offlineResponse() {

    return new Response(
        "Application indisponible hors ligne.",
        {
            status: 503,
            headers: {
                "Content-Type":
                    "text/plain; charset=utf-8"
            }
        }
    );

}

/*
=========================================
INSTALL
=========================================
*/

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_ASSETS))
            .then(() => self.skipWaiting())

    );

});

/*
=========================================
ACTIVATE
=========================================
*/

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(keys => {

                return Promise.all(

                    keys
                        .filter(key =>
                            key.startsWith(
                                "wedding-domaines-"
                            ) &&
                            key !== CACHE_NAME
                        )
                        .map(key => caches.delete(key))

                );

            })
            .then(() => self.clients.claim())

    );

});

/*
=========================================
FETCH
=========================================
Navigation : réseau d'abord, cache en
repli (pour voir les mises à jour).
Autres fichiers : cache d'abord,
revalidation silencieuse en arrière-plan.
=========================================
*/

self.addEventListener("fetch", event => {

    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    const cachePromise =
        caches.open(CACHE_NAME);

    if (request.mode === "navigate") {

        const networkPromise =
            fetch(request)
                .then(response => {

                    if (!response || !response.ok) {
                        return response;
                    }

                    return cachePromise
                        .then(cache =>
                            cache.put(
                                request,
                                response.clone()
                            )
                        )
                        .then(() => response);

                });

        event.waitUntil(
            networkPromise.catch(
                () => undefined
            )
        );

        event.respondWith(

            networkPromise.catch(() =>

                cachePromise.then(cache =>

                    cache.match(request)
                        .then(hit => hit ||
                            cache.match("./index.html")
                        )
                        .then(hit => hit || offlineResponse())

                )

            )

        );

        return;

    }

    const networkPromise =
        fetch(request)
            .then(response => {

                if (response && response.ok) {

                    return cachePromise
                        .then(cache =>
                            cache.put(
                                request,
                                response.clone()
                            )
                        )
                        .then(() => response);

                }

                return response;

            })
            .catch(async () => {

                const cached =
                    await caches.match(request);

                return cached || offlineResponse();

            });

    event.waitUntil(
        networkPromise.catch(
            () => undefined
        )
    );

    event.respondWith(

        (async () => {

            const cache =
                await cachePromise;

            const cached =
                await cache.match(request);

            if (cached) {
                return cached;
            }

            return networkPromise;

        })()

    );

});

/*
=========================================
MESSAGE
=========================================
*/

self.addEventListener("message", event => {

    if (event.data === "SKIP_WAITING") {
        self.skipWaiting();
    }

});
