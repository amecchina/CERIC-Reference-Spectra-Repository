/* Generic periodic-table page controller used by every beamline page. */
(function () {
    const beamline = XAS.beamlineById(document.body.dataset.beamline);
    const table = document.querySelector("#periodic-table");
    const search = document.querySelector("#element-search");
    const filesSection = document.querySelector("#files-section");
    const filesCount = document.querySelector("#files-count");
    const filesTitle = document.querySelector("#files-title");
    const fileList = document.querySelector("#file-list");
    const downloadAllButton = document.querySelector("#download-all-button");
    const available = new Set();
    let fileManifest = {};
    let currentFiles = [];
    let selectedElement = null;

    if (!beamline) {
        throw new Error("Missing or unknown beamline configuration.");
    }

    loadPageManifest();

    search.addEventListener("input", () => {
        refreshUploadedSpectra();
        filterPeriodicTable(search.value.trim().toLowerCase());
    });

    window.addEventListener("storage", (event) => {
        if (event.key === "reference-spectra-uploaded-xdi") {
            refreshUploadedSpectra();
        }
    });
    window.addEventListener("uploaded-spectra-updated", refreshUploadedSpectra);
    window.addEventListener("pageshow", refreshUploadedSpectra);
    window.addEventListener("focus", refreshUploadedSpectra);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            refreshUploadedSpectra();
        }
    });

    downloadAllButton.addEventListener("click", () => XAS.downloadSpectraZip(currentFiles));

    window.addUploadedSpectraToBeamline = (files) => {
        addUploadedFilesToManifest(files);
        updateAvailableElements();
        showUploadedFiles(files);
    };

    async function loadPageManifest() {
        try {
            fileManifest = await XAS.fetchJson("./manifest.json");
        } catch {
            fileManifest = {};
        }

        applyStoredUploadsToBeamline();
        Object.keys(fileManifest).forEach((symbol) => available.add(symbol));
        renderPeriodicTable();
        updateAvailableElements();
    }

    function renderPeriodicTable() {
        table.replaceChildren(...XAS.elements.map((element) => {
            const button = document.createElement("button");

            button.className = "element";
            button.style.gridColumn = element.col;
            button.style.gridRow = element.row;
            button.type = "button";
            button.disabled = true;
            button.dataset.symbol = element.symbol;
            button.title = `${element.n} - ${element.name} (${element.symbol})`;
            button.dataset.search = `${element.n} ${element.symbol} ${element.name}`.toLowerCase();
            button.innerHTML = `
                <span class="number">${element.n}</span>
                <span class="symbol">${element.symbol}</span>
                <span class="name">${element.name}</span>
            `;

            return button;
        }));
    }

    function filterPeriodicTable(query) {
        document.querySelectorAll(".element").forEach((button) => {
            if (!query) {
                button.classList.remove("is-dimmed");
                return;
            }

            button.classList.toggle("is-dimmed", !button.dataset.search.includes(query));
        });

        selectExactSearchMatch(query);
    }

    function selectExactSearchMatch(query) {
        if (!query) {
            return;
        }

        const exactElement = XAS.elements.find((item) => (
            item.symbol.toLowerCase() === query ||
            item.name.toLowerCase() === query ||
            item.n.toString() === query
        ));
        const fileSymbol = Object.entries(fileManifest).find(([, files]) => (
            files.some((item) => item.file.toLowerCase().includes(query))
        ))?.[0];
        const element = exactElement || XAS.elements.find((item) => item.symbol === fileSymbol);
        const button = element ? document.querySelector(`.element[data-symbol="${element.symbol}"]`) : null;

        if (element && button && !button.disabled && !button.classList.contains("selected")) {
            selectElement(element, button);
        }
    }

    function updateAvailableElements() {
        document.querySelectorAll(".element").forEach((button) => {
            const element = XAS.elements.find((item) => item.symbol === button.dataset.symbol);
            const isAvailable = available.has(button.dataset.symbol);
            const files = fileManifest[button.dataset.symbol] || [];
            const fileTerms = files.map((item) => item.file).join(" ");

            button.classList.toggle("available", isAvailable);
            button.disabled = !isAvailable;
            button.dataset.search = `${element.n} ${element.symbol} ${element.name} ${fileTerms}`.toLowerCase();

            if (isAvailable && element && !button.dataset.bound) {
                button.addEventListener("click", () => selectElement(element, button));
                button.dataset.bound = "true";
            }
        });
    }

    function refreshUploadedSpectra() {
        applyStoredUploadsToBeamline();
        Object.keys(fileManifest).forEach((symbol) => available.add(symbol));
        updateAvailableElements();

        if (selectedElement && fileManifest[selectedElement.symbol]) {
            showFiles(selectedElement, { scroll: false });
        }
    }

    function applyStoredUploadsToBeamline() {
        getStoredUploadsForThisBeamline().forEach(addUploadedFileToManifest);
    }

    function getStoredUploadsForThisBeamline() {
        return typeof window.getStoredUploadedSpectra === "function"
            ? window.getStoredUploadedSpectra().filter((file) => file.metadata.beamline === beamline.name)
            : [];
    }

    function addUploadedFilesToManifest(files) {
        files
            .filter((file) => file.metadata.beamline === beamline.name)
            .forEach(addUploadedFileToManifest);
    }

    function addUploadedFileToManifest(file) {
        const symbol = file.metadata.symbol;

        if (!symbol || symbol === "N/A") {
            return;
        }

        fileManifest[symbol] = fileManifest[symbol] || [];

        if (!fileManifest[symbol].some((item) => item.file.trim() === file.fileName)) {
            fileManifest[symbol].unshift({
                file: file.fileName,
                text: file.text,
                url: file.objectUrl
            });
        }

        available.add(symbol);
    }

    function showUploadedFiles(files) {
        const uploadedFiles = files.filter((file) => file.metadata.beamline === beamline.name);

        if (!uploadedFiles.length) {
            return;
        }

        const symbol = uploadedFiles[0].metadata.symbol;
        const element = XAS.elements.find((item) => item.symbol === symbol);
        const button = document.querySelector(`.element[data-symbol="${symbol}"]`);

        if (element && button) {
            selectElement(element, button);
        }
    }

    function selectElement(element, button) {
        document.querySelectorAll(".element.selected").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        selectedElement = element;
        showFiles(element);
    }

    async function showFiles(element, options = {}) {
        const files = fileManifest[element.symbol] || [];

        filesSection.hidden = false;
        filesSection.classList.toggle("single-row-results", files.length <= 3);
        filesCount.textContent = XAS.compoundCountLabel(files.length);
        filesTitle.textContent = `${element.n} ${element.name} (${element.symbol})`;
        downloadAllButton.disabled = files.length === 0;
        fileList.replaceChildren();

        currentFiles = await Promise.all(files.map(loadSpectrumEntry));
        fileList.replaceChildren(...currentFiles.map((entry) => XAS.createSpectrumCard(entry)));
        if (options.scroll !== false) {
            filesSection.scrollIntoView({
                behavior: "smooth",
                block: files.length <= 3 ? "center" : "start"
            });
        }
    }

    async function loadSpectrumEntry(item) {
        const fileName = item.file.trim();
        const href = item.url || `./files/${encodeURIComponent(fileName)}`;
        const text = item.text || await XAS.fetchText(href);
        const metadata = XAS.parseMetadata(text);

        return {
            beamline: beamline.name,
            file: fileName,
            href,
            text,
            metadata,
            points: XAS.parsePoints(text)
        };
    }
}());
