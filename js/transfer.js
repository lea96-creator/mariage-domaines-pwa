/*
=========================================
Wedding Domaines Planner
transfer.js — sauvegarde / restauration
=========================================
*/

(function () {

    "use strict";

    let notify = () => {};
    let onImported = () => {};

    function init(options = {}) {

        if (typeof options.onMessage === "function") {
            notify = options.onMessage;
        }

        if (typeof options.onImported === "function") {
            onImported = options.onImported;
        }

    }

    function todayISO() {

        const today = new Date();

        return (
            `${today.getFullYear()}-`
            + String(today.getMonth() + 1)
                .padStart(2, "0")
            + "-"
            + String(today.getDate())
                .padStart(2, "0")
        );

    }

    function backupFilename() {

        return (
            "sauvegarde-domaines-"
            + todayISO()
            + ".json"
        );

    }

    function downloadBlob(blob, filename) {

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(
            () => URL.revokeObjectURL(url),
            1000
        );

    }

    async function exportBackupFile() {

        const blob = new Blob(
            [
                JSON.stringify(
                    buildBackup(),
                    null,
                    2
                )
            ],
            { type: "application/json" }
        );

        const filename = backupFilename();

        if (
            typeof File !== "undefined" &&
            navigator.share &&
            navigator.canShare
        ) {

            const file = new File(
                [blob],
                filename,
                { type: "application/json" }
            );

            if (
                navigator.canShare({ files: [file] })
            ) {

                try {

                    await navigator.share({
                        files: [file],
                        title: "Sauvegarde des domaines",
                        text: "Sauvegarde à transférer sur un autre appareil"
                    });

                    notify("Sauvegarde partagée");
                    return;

                } catch (error) {

                    if (
                        error &&
                        error.name === "AbortError"
                    ) {
                        return;
                    }

                    console.warn(
                        "Partage impossible, téléchargement utilisé",
                        error
                    );

                }

            }

        }

        downloadBlob(blob, filename);

        notify("Sauvegarde téléchargée");

    }

    async function importBackupFile(input) {

        if (!input) return;

        const file =
            input.files && input.files[0];

        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {

            notify(
                "Erreur : fichier trop volumineux (5 Mo max)",
                "error"
            );

            input.value = "";
            return;

        }

        try {

            const text = await file.text();
            const payload = parseBackup(text);

            if (
                !window.confirm(
                    "Fusionner cette sauvegarde ?\n\n" +
                    "Les domaines ayant le même identifiant " +
                    "seront remplacés, les autres ajoutés."
                )
            ) {
                return;
            }

            const result = mergeBackup(payload);

            onImported();

            notify(
                `${result.added} ajouté(s), ${
                    result.updated
                } remplacé(s)`
            );

        } catch (error) {

            notify(
                `Erreur : ${error.message}`,
                "error"
            );

        } finally {

            input.value = "";

        }

    }

    window.Transfer = {
        init,
        exportBackupFile,
        importBackupFile
    };

})();
