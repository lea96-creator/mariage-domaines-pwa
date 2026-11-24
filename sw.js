/*
==========================================
 Wedding Domaines Planner
 Service Worker V1
==========================================
*/

const CACHE_NAME = "wedding-domaines-v1.0.0";

const APP_ASSETS = [

    "./",
    "./index.html",

    "./manifest.json",

    "./css/style.css",

    "./js/app.js",
    "./js/storage.js",
    "./js/questions.js",
    "./js/dashboard.js",
    "./js/excelExport.js",

    "./icons/icon-72.png",
    "./icons/icon-96.png",
    "./icons/icon-128.png",
    "./icons/icon-144.png",
    "./icons/icon-152.png",
    "./icons/icon-192.png",
    "./icons/icon-384.png",
    "./icons/icon-512.png"

];

/*
==========================================
INSTALL
==========================================
*/

self.addEventListener("install", event => {

    console.log("Service Worker installé");

    event.waitUntil(

        caches.open(CACHE_NAME)

            .then(cache => {

                return cache.addAll(APP_ASSETS);

            })

    );

    self.skipWaiting();

});

/*
==========================================
ACTIVATE
==========================================
*/

self.addEventListener("activate", event => {

    console.log("Service Worker activé");

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys

                    .filter(key => key !== CACHE_NAME)

                    .map(key => caches.delete(key))

            );

        })

    );

    self.clients.claim();

});

/*
==========================================
FETCH
==========================================
*/

self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {

        return;

    }

    event.respondWith(

        caches.match(event.request)

            .then(cachedResponse => {

                if (cachedResponse) {

                    return cachedResponse;

                }

                return fetch(event.request)

                    .then(networkResponse => {

                        const responseClone =
                            networkResponse.clone();

                        caches.open(CACHE_NAME)

                            .then(cache => {

                                cache.put(
                                    event.request,
                                    responseClone
                                );

                            });

                        return networkResponse;

                    })

                    .catch(() => {

                        if (
                            event.request.headers.get("accept")
                            ?.includes("text/html")
                        ) {

                            return caches.match("./index.html");

                        }

                    });

            })

    );

});

/*
==========================================
MESSAGE
==========================================
*/

self.addEventListener("message", event => {

    if (event.data === "SKIP_WAITING") {

        self.skipWaiting();

    }

});
