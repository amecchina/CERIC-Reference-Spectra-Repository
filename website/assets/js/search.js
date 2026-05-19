/* Home-page metadata search across all configured beamline repositories. */
(function () {
    const searchForm = document.querySelector("#metadata-search-form");
    const symbolSelect = document.querySelector("#search-symbol");
    const edgeSelect = document.querySelector("#search-edge");
    const monoSelect = document.querySelector("#search-mono");
    const temperatureSelect = document.querySelector("#search-temperature");
    const beamlineSelect = document.querySelector("#search-beamline");
    const searchButton = document.querySelector("#metadata-search-button");
    const downloadMatchesButton = document.querySelector("#download-matches-button");
    const resultsSection = document.querySelector("#search-results");
    const resultsCount = document.querySelector("#search-results-count");
    const resultList = document.querySelector("#search-result-list");
    const spectraKeys = new Set();
    let spectraIndex = [];
    let currentSearchResults = [];
    let filtersReady = false;

    window.addUploadedSpectraToSearch = (files) => {
        const uploadedEntries = filesToSearchEntries(files);

        if (!uploadedEntries.length) {
            return;
        }

        mergeIntoSearchIndex(uploadedEntries);
        addDynamicFilterOptions(uploadedEntries);
        updateFilterAvailability();
        renderSearchResults(uploadedEntries, "uploaded");
    };

    XAS.loadAllSpectra("./")
        .then((spectra) => {
            mergeIntoSearchIndex(XAS.mergeEntries(storedUploadsForSearch(), spectra));
            populateFilters(spectraIndex);
            filtersReady = true;
            updateFilterAvailability();
            setSearchEnabled(true);
        })
        .catch(() => {
            [symbolSelect, edgeSelect, monoSelect, temperatureSelect, beamlineSelect]
                .forEach((select) => fillSelect(select, [["", "Unavailable"]]));
        });

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        renderSearchResults(filterSpectra());
    });

    searchForm.addEventListener("change", updateFilterAvailability);
    downloadMatchesButton.addEventListener("click", () => XAS.downloadSpectraZip(currentSearchResults));

    window.addEventListener("pageshow", (event) => {
        const navigation = performance.getEntriesByType("navigation")[0];
        const isHistoryNavigation = event.persisted || navigation?.type === "back_forward";

        if (isHistoryNavigation) {
            resetSearchState();
        }

        syncStoredUploads({ showNewUploads: isHistoryNavigation });
    });
    window.addEventListener("focus", () => syncStoredUploads({ showNewUploads: true }));
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            syncStoredUploads({ showNewUploads: true });
        }
    });
    window.addEventListener("popstate", () => {
        resetSearchState();
        syncStoredUploads({ showNewUploads: true });
    });

    function mergeIntoSearchIndex(entries) {
        const newEntries = entries.filter((entry) => !spectraKeys.has(entryKey(entry)));

        spectraIndex = XAS.mergeEntries(newEntries, spectraIndex);
        newEntries.forEach((entry) => spectraKeys.add(entryKey(entry)));
        return newEntries;
    }

    function entryKey(entry) {
        return `${entry.beamline}:${entry.file}`;
    }

    function syncStoredUploads({ showNewUploads = false } = {}) {
        const newEntries = mergeIntoSearchIndex(storedUploadsForSearch());

        if (!newEntries.length) {
            return;
        }

        if (filtersReady) {
            addDynamicFilterOptions(newEntries);
            updateFilterAvailability();
        }

        if (showNewUploads) {
            renderSearchResults(newEntries, "uploaded");
        } else if (!resultsSection.hidden) {
            renderSearchResults(filterSpectra(), "matching", { scroll: false });
        }
    }

    function storedUploadsForSearch() {
        return typeof window.getStoredUploadedSpectra === "function"
            ? filesToSearchEntries(window.getStoredUploadedSpectra())
            : [];
    }

    function filesToSearchEntries(files) {
        return files
            .filter((file) => file.text && !file.error)
            .map((file) => {
                const entry = XAS.spectrumEntryFromFile(file);
                return {
                    ...entry,
                    symbol: entry.metadata.symbol,
                    edge: entry.metadata.edge,
                    mono: entry.metadata.mono,
                    monoReflection: entry.metadata.monoReflection,
                    temperature: entry.metadata.temperature
                };
            });
    }

    function populateFilters(spectra) {
        fillSelect(symbolSelect, [["", "Any"], ...XAS.elementSymbols.map((value) => [value, value])]);
        fillSelect(edgeSelect, [["", "Any"], ...XAS.elementEdges.map((value) => [value, value])]);
        fillSelect(monoSelect, [["", "Any"], ...XAS.monoNameOptions.map((value) => [value, value])]);
        fillSelect(temperatureSelect, [["", "Any"], ...XAS.uniqueValues(spectra.map((item) => item.temperature)).map((value) => [value, value])]);
        fillSelect(beamlineSelect, [["", "Any"], ...XAS.beamlines.map((beamline) => [beamline.name, beamline.name])]);
    }

    function fillSelect(select, options) {
        select.replaceChildren(...options.map(([value, label, disabled = false]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            option.disabled = disabled;
            return option;
        }));
    }

    function addDynamicFilterOptions(entries) {
        const existingTemperatures = new Set(Array.from(temperatureSelect.options).map((option) => option.value));
        XAS.uniqueValues(entries.map((item) => item.temperature)).forEach((value) => {
            if (!value || existingTemperatures.has(value)) {
                return;
            }

            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            temperatureSelect.appendChild(option);
        });
    }

    function setSearchEnabled(enabled) {
        [symbolSelect, edgeSelect, monoSelect, temperatureSelect, beamlineSelect, searchButton].forEach((control) => {
            control.disabled = !enabled;
        });
    }

    function filterSpectra() {
        return matchingSpectra({
            symbol: symbolSelect.value,
            edge: edgeSelect.value,
            mono: monoSelect.value,
            temperature: temperatureSelect.value,
            beamline: beamlineSelect.value
        });
    }

    function matchingSpectra(filters) {
        return spectraIndex.filter((item) => {
            const metadata = item.metadata || {};
            const symbolMatches = !filters.symbol || metadata.symbol === filters.symbol;
            const edgeMatches = !filters.edge || metadata.edge === filters.edge;
            const monoMatches = !filters.mono || metadata.monoReflection === filters.mono;
            const temperatureMatches = !filters.temperature || metadata.temperature === filters.temperature;
            const beamlineMatches = !filters.beamline || item.beamline === filters.beamline;
            return symbolMatches && edgeMatches && monoMatches && temperatureMatches && beamlineMatches;
        });
    }

    function updateFilterAvailability() {
        if (!spectraIndex.length) {
            return;
        }

        updateSelectOptions(symbolSelect, "symbol");
        updateSelectOptions(edgeSelect, "edge");
        updateSelectOptions(monoSelect, "mono");
        updateSelectOptions(temperatureSelect, "temperature");
        updateSelectOptions(beamlineSelect, "beamline");
    }

    function updateSelectOptions(select, field) {
        Array.from(select.options).forEach((option) => {
            if (!option.value) {
                option.disabled = false;
                return;
            }

            const filters = {
                symbol: field === "symbol" ? option.value : symbolSelect.value,
                edge: field === "edge" ? option.value : edgeSelect.value,
                mono: field === "mono" ? option.value : monoSelect.value,
                temperature: field === "temperature" ? option.value : temperatureSelect.value,
                beamline: field === "beamline" ? option.value : beamlineSelect.value
            };

            option.disabled = matchingSpectra(filters).length === 0;
        });
    }

    function resetSearchState() {
        [symbolSelect, edgeSelect, monoSelect, temperatureSelect, beamlineSelect].forEach((select) => {
            select.value = "";
        });

        updateFilterAvailability();
        currentSearchResults = [];
        resultsSection.hidden = true;
        resultsCount.textContent = "";
        resultList.replaceChildren();
        downloadMatchesButton.disabled = true;
    }

    function renderSearchResults(results, mode = "matching", options = {}) {
        currentSearchResults = results;
        resultsSection.hidden = false;
        resultsCount.textContent = mode === "uploaded"
            ? `${results.length} uploaded file${results.length === 1 ? "" : "s"}`
            : `${results.length} matching ${results.length === 1 ? "spectrum" : "spectra"}`;
        downloadMatchesButton.disabled = results.length === 0;
        resultList.replaceChildren(...results.map((entry) => XAS.createSpectrumCard(entry)));

        if (options.scroll !== false) {
            resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }
}());
