/*
=========================================
Wedding Domaines Planner
store.js — état local (localStorage)
=========================================
*/

const STORAGE_KEY = "wedding-domaines:v1";
const SCHEMA_VERSION = 1;

let state = {
    version: SCHEMA_VERSION,
    domains: []
};

/*
=========================================
UTILITAIRES
=========================================
*/

function createId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `domaine-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

}

function asText(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();

}

function asNumber(value) {

    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number =
        typeof value === "number"
            ? value
            : Number(String(value).replace(",", "."));

    return Number.isFinite(number) ? number : null;

}

function asDate(value) {

    const text = asText(value);

    return /^\d{4}-\d{2}-\d{2}$/.test(text)
        ? text
        : "";

}

function asIsoDate(value) {

    const text = asText(value);
    const date = new Date(text);

    return Number.isNaN(date.getTime())
        ? new Date().toISOString()
        : date.toISOString();

}

function sanitizeAnswers(value) {

    const source =
        value && typeof value === "object"
            ? value
            : {};

    const answers = {};

    QUESTION_INDEX.forEach((entry, id) => {

        const answer = source[id];

        if (
            typeof answer === "string" &&
            VALID_ANSWERS.has(answer)
        ) {
            answers[id] = answer;
        }

    });

    return answers;

}

function sanitizeNotes(value) {

    const source =
        value && typeof value === "object"
            ? value
            : {};

    const notes = {};

    QUESTION_INDEX.forEach((entry, id) => {

        if (
            source[id] !== null &&
            source[id] !== undefined
        ) {
            notes[id] = asText(source[id]);
        }

    });

    return notes;

}

function sanitizeDomain(raw = {}) {

    const source =
        raw && typeof raw === "object"
            ? raw
            : {};

    const now = new Date().toISOString();

    return {
        id: asText(source.id) || createId(),

        domainName: asText(source.domainName),
        visitDate: asDate(source.visitDate),
        contactName: asText(source.contactName),
        contactPhone: asText(source.contactPhone),
        contactEmail: asText(source.contactEmail),
        estimatedPrice: asNumber(source.estimatedPrice),

        notes: sanitizeNotes(source.notes),
        answers: sanitizeAnswers(source.answers),
        generalNotes: asText(source.generalNotes),

        createdAt: asIsoDate(source.createdAt || now),
        updatedAt: asIsoDate(source.updatedAt || now)
    };

}

function sanitizeState(value) {

    const source =
        value && typeof value === "object"
            ? value
            : {};

    const domains =
        Array.isArray(source.domains)
            ? source.domains
            : [];

    return {
        version: SCHEMA_VERSION,
        domains: domains.map(sanitizeDomain)
    };

}

/*
=========================================
LECTURE / ÉCRITURE
=========================================
*/

function loadState() {

    try {

        const raw = localStorage.getItem(STORAGE_KEY);

        state = raw
            ? sanitizeState(JSON.parse(raw))
            : sanitizeState({ domains: [] });

    } catch (error) {

        console.warn(
            "Storage indisponible, session en mémoire uniquement",
            error
        );

        state = sanitizeState({ domains: [] });

    }

    return state;

}

function persistState() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );

        return true;

    } catch (error) {

        console.error(
            "Impossible d'enregistrer dans le navigateur",
            error
        );

        return false;

    }

}

function getState() {
    return state;
}

/*
=========================================
CRUD
=========================================
*/

function getDomainById(id) {

    return (
        state.domains.find(
            domain => domain.id === id
        ) || null
    );

}

function upsertDomain(data) {

    const domain = sanitizeDomain(data);

    const index = state.domains.findIndex(
        item => item.id === domain.id
    );

    if (index >= 0) {
        state.domains[index] = domain;
    } else {
        state.domains.push(domain);
    }

    persistState();

    return domain;

}

function deleteDomainById(id) {

    const before = state.domains.length;

    state.domains = state.domains.filter(
        domain => domain.id !== id
    );

    const removed = state.domains.length < before;

    if (removed) persistState();

    return removed;

}

/*
=========================================
SAUVEGARDE / RESTAURATION
=========================================
*/

function buildBackup() {

    return {
        app: "Wedding Domaines Planner",
        version: SCHEMA_VERSION,
        exportDate: new Date().toISOString(),
        domains: state.domains
    };

}

function parseBackup(text) {

    let parsed;

    try {
        parsed = JSON.parse(text);
    } catch (error) {
        throw new Error(
            "Le fichier n'est pas un JSON valide."
        );
    }

    const domains =
        Array.isArray(parsed)
            ? parsed
            : parsed && Array.isArray(parsed.domains)
                ? parsed.domains
                : null;

    if (!domains) {
        throw new Error(
            "Aucune liste de domaines trouvée."
        );
    }

    return sanitizeState({ domains });

}

function mergeBackup(payload) {

    const incoming = sanitizeState(payload);

    let added = 0;
    let updated = 0;

    incoming.domains.forEach(domain => {

        const index = state.domains.findIndex(
            item => item.id === domain.id
        );

        if (index >= 0) {

            state.domains[index] = domain;
            updated++;

        } else {

            state.domains.push(domain);
            added++;

        }

    });

    persistState();

    return { added, updated };

}
