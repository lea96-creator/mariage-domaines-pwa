/*
=========================================
Wedding Domaines Planner
theme.js — thème clair / sombre
=========================================
*/

(function () {

    "use strict";

    const STORAGE_KEY =
        "wedding-domaines:theme";

    const META_COLORS = {
        light: "#8b5e3c",
        dark: "#262421"
    };

    const LABELS = {
        light: "Activer le thème sombre",
        dark: "Activer le thème clair"
    };

    function current() {

        return document
            .documentElement
            .getAttribute("data-theme") === "dark"
                ? "dark"
                : "light";

    }

    function hasChoice() {

        try {
            return localStorage
                .getItem(STORAGE_KEY) !== null;
        } catch (error) {
            return false;
        }

    }

    function setTheme(theme, persist = false) {

        const value =
            theme === "dark" ? "dark" : "light";

        document
            .documentElement
            .setAttribute(
                "data-theme",
                value
            );

        const button =
            document.getElementById("btnTheme");

        if (button) {

            button.setAttribute(
                "aria-label",
                LABELS[value]
            );
            button.setAttribute(
                "title",
                LABELS[value]
            );
            button.setAttribute(
                "aria-pressed",
                value === "dark"
                    ? "true"
                    : "false"
            );

        }

        const meta =
            document.getElementById("themeColor");

        if (meta) {
            meta.setAttribute(
                "content",
                META_COLORS[value]
            );
        }

        if (persist) {

            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    value
                );
            } catch (error) {}

        }

        return value;

    }

    function init() {

        setTheme(current());

        const button =
            document.getElementById("btnTheme");

        if (button) {

            button.addEventListener(
                "click",
                () => {

                    setTheme(
                        current() === "dark"
                            ? "light"
                            : "dark",
                        true
                    );

                }
            );

        }

        if (window.matchMedia) {

            const query =
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                );

            const onChange = event => {

                if (!hasChoice()) {
                    setTheme(
                        event.matches
                            ? "dark"
                            : "light"
                    );
                }

            };

            if (query.addEventListener) {
                query.addEventListener(
                    "change",
                    onChange
                );
            } else if (query.addListener) {
                query.addListener(onChange);
            }

        }

    }

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

    window.Theme = {
        STORAGE_KEY,
        current,
        hasChoice,
        setTheme,
        init
    };

})();
