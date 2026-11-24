/*
=========================================
Wedding Domaines Planner
storage.js
IndexedDB
=========================================
*/

const DB_NAME = "WeddingDomainesDB";
const DB_VERSION = 1;

const STORES = {
    domains: "domains",
    photos: "photos"
};

let db = null;

/*
=========================================
INITIALISATION DB
=========================================
*/

async function initDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );

        request.onerror = (event) => {

            console.error(
                "Erreur IndexedDB",
                event
            );

            reject(event);

        };

        request.onsuccess = (event) => {

            db = event.target.result;

            console.log(
                "IndexedDB connectée"
            );

            resolve(db);

        };

        request.onupgradeneeded = (event) => {

            const database =
                event.target.result;

            /*
            =========================
            DOMAINES
            =========================
            */

            if (
                !database.objectStoreNames.contains(
                    STORES.domains
                )
            ) {

                const domainStore =
                    database.createObjectStore(
                        STORES.domains,
                        {
                            keyPath: "id"
                        }
                    );

                domainStore.createIndex(
                    "domainName",
                    "domainName",
                    {
                        unique: false
                    }
                );

                domainStore.createIndex(
                    "score",
                    "score",
                    {
                        unique: false
                    }
                );

            }

            /*
            =========================
            PHOTOS
            =========================
            */

            if (
                !database.objectStoreNames.contains(
                    STORES.photos
                )
            ) {

                database.createObjectStore(
                    STORES.photos,
                    {
                        keyPath: "id"
                    }
                );

            }

        };

    });

}

/*
=========================================
AJOUT DOMAINE
=========================================
*/

async function saveDomain(domain) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                [STORES.domains],
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORES.domains
            );

        const request =
            store.put(domain);

        request.onsuccess = () => {

            resolve(true);

        };

        request.onerror = () => {

            reject(false);

        };

    });

}

/*
=========================================
CHARGER DOMAINES
=========================================
*/

async function loadDomains() {

    if (!db) {

        await initDatabase();

    }

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                [STORES.domains],
                "readonly"
            );

        const store =
            transaction.objectStore(
                STORES.domains
            );

        const request =
            store.getAll();

        request.onsuccess = () => {

            resolve(request.result || []);

        };

        request.onerror = () => {

            reject([]);

        };

    });

}
/*
=========================================
SUPPRIMER DOMAINE
=========================================
*/

async function deleteDomain(id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                [STORES.domains],
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORES.domains
            );

        const request =
            store.delete(id);

        request.onsuccess = () => {

            resolve(true);

        };

        request.onerror = () => {

            reject(false);

        };

    });

}

/*
=========================================
RÉCUPÉRER DOMAINE
=========================================
*/

async function getDomain(id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                [STORES.domains],
                "readonly"
            );

        const store =
            transaction.objectStore(
                STORES.domains
            );

        const request =
            store.get(id);

        request.onsuccess = () => {

            resolve(request.result);

        };

        request.onerror = () => {

            reject(null);

        };

    });

}

/*
=========================================
ENREGISTREMENT PHOTO
=========================================
*/

async function savePhoto(photoObject) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                [STORES.photos],
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORES.photos
            );

        const request =
            store.put(photoObject);

        request.onsuccess = () => {

            resolve(true);

        };

        request.onerror = () => {

            reject(false);

        };

    });

}

/*
=========================================
CHARGER PHOTOS D'UN DOMAINE
=========================================
*/

async function getDomainPhotos(domainId) {

    return new Promise((resolve) => {

        const transaction =
            db.transaction(
                [STORES.photos],
                "readonly"
            );

        const store =
            transaction.objectStore(
                STORES.photos
            );

        const request =
            store.getAll();

        request.onsuccess = () => {

            const photos =
                request.result.filter(
                    photo =>
                        photo.domainId === domainId
                );

            resolve(photos);

        };

    });

}

/*
=========================================
SUPPRIMER PHOTO
=========================================
*/

async function deletePhoto(photoId) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                [STORES.photos],
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORES.photos
            );

        const request =
            store.delete(photoId);

        request.onsuccess = () => {

            resolve(true);

        };

        request.onerror = () => {

            reject(false);

        };

    });

}

/*
=========================================
EXPORT COMPLET
=========================================
*/

async function exportBackupJSON() {

    const domains =
        await loadDomains();

    const backup = {

        exportDate:
            new Date().toISOString(),

        version: "1.0",

        domains: domains

    };

    const blob = new Blob(

        [
            JSON.stringify(
                backup,
                null,
                2
            )
        ],

        {
            type:
            "application/json"
        }

    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "backup-mariage-domaines.json";

    link.click();

}

/*
=========================================
STATISTIQUES
=========================================
*/

async function getDashboardStats() {

    const domains =
        await loadDomains();

    if (!domains.length) {

        return {

            total: 0,

            averageScore: 0,

            bestScore: 0,

            favoriteDomain: null

        };

    }

    const best =
        [...domains]
            .sort(
                (a, b) =>
                    b.score - a.score
            )[0];

    const average =
        Math.round(

            domains.reduce(
                (sum, d) =>
                    sum + d.score,
                0
            ) / domains.length

        );

    return {

        total:
            domains.length,

        averageScore:
            average,

        bestScore:
            best.score,

        favoriteDomain:
            best.domainName

    };

}

/*
=========================================
AUTO START
=========================================
*/

window.addEventListener(
    "load",
    async () => {

        try {

            await initDatabase();

            console.log(
                "WeddingDomainesDB prête"
            );

        }
        catch(error) {

            console.error(error);

        }

    }
);
