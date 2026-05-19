/* Shared data, XDI parsing, cards, plots, and download helpers for the repository. */
(function () {
    const beamlines = [
        { id: "lisa-esrf", name: "LISA@ESRF", facility: "ESRF" },
        { id: "xas-elettra", name: "XAS@ELETTRA", facility: "ELETTRA" },
        { id: "astra-solaris", name: "ASTRA@SOLARIS", facility: "SOLARIS" }
    ];

    const elements = [
        { n: 1, symbol: "H", name: "Hydrogen", row: 1, col: 1 },
        { n: 2, symbol: "He", name: "Helium", row: 1, col: 18 },
        { n: 3, symbol: "Li", name: "Lithium", row: 2, col: 1 },
        { n: 4, symbol: "Be", name: "Beryllium", row: 2, col: 2 },
        { n: 5, symbol: "B", name: "Boron", row: 2, col: 13 },
        { n: 6, symbol: "C", name: "Carbon", row: 2, col: 14 },
        { n: 7, symbol: "N", name: "Nitrogen", row: 2, col: 15 },
        { n: 8, symbol: "O", name: "Oxygen", row: 2, col: 16 },
        { n: 9, symbol: "F", name: "Fluorine", row: 2, col: 17 },
        { n: 10, symbol: "Ne", name: "Neon", row: 2, col: 18 },
        { n: 11, symbol: "Na", name: "Sodium", row: 3, col: 1 },
        { n: 12, symbol: "Mg", name: "Magnesium", row: 3, col: 2 },
        { n: 13, symbol: "Al", name: "Aluminium", row: 3, col: 13 },
        { n: 14, symbol: "Si", name: "Silicon", row: 3, col: 14 },
        { n: 15, symbol: "P", name: "Phosphorus", row: 3, col: 15 },
        { n: 16, symbol: "S", name: "Sulfur", row: 3, col: 16 },
        { n: 17, symbol: "Cl", name: "Chlorine", row: 3, col: 17 },
        { n: 18, symbol: "Ar", name: "Argon", row: 3, col: 18 },
        { n: 19, symbol: "K", name: "Potassium", row: 4, col: 1 },
        { n: 20, symbol: "Ca", name: "Calcium", row: 4, col: 2 },
        { n: 21, symbol: "Sc", name: "Scandium", row: 4, col: 3 },
        { n: 22, symbol: "Ti", name: "Titanium", row: 4, col: 4 },
        { n: 23, symbol: "V", name: "Vanadium", row: 4, col: 5 },
        { n: 24, symbol: "Cr", name: "Chromium", row: 4, col: 6 },
        { n: 25, symbol: "Mn", name: "Manganese", row: 4, col: 7 },
        { n: 26, symbol: "Fe", name: "Iron", row: 4, col: 8 },
        { n: 27, symbol: "Co", name: "Cobalt", row: 4, col: 9 },
        { n: 28, symbol: "Ni", name: "Nickel", row: 4, col: 10 },
        { n: 29, symbol: "Cu", name: "Copper", row: 4, col: 11 },
        { n: 30, symbol: "Zn", name: "Zinc", row: 4, col: 12 },
        { n: 31, symbol: "Ga", name: "Gallium", row: 4, col: 13 },
        { n: 32, symbol: "Ge", name: "Germanium", row: 4, col: 14 },
        { n: 33, symbol: "As", name: "Arsenic", row: 4, col: 15 },
        { n: 34, symbol: "Se", name: "Selenium", row: 4, col: 16 },
        { n: 35, symbol: "Br", name: "Bromine", row: 4, col: 17 },
        { n: 36, symbol: "Kr", name: "Krypton", row: 4, col: 18 },
        { n: 37, symbol: "Rb", name: "Rubidium", row: 5, col: 1 },
        { n: 38, symbol: "Sr", name: "Strontium", row: 5, col: 2 },
        { n: 39, symbol: "Y", name: "Yttrium", row: 5, col: 3 },
        { n: 40, symbol: "Zr", name: "Zirconium", row: 5, col: 4 },
        { n: 41, symbol: "Nb", name: "Niobium", row: 5, col: 5 },
        { n: 42, symbol: "Mo", name: "Molybdenum", row: 5, col: 6 },
        { n: 43, symbol: "Tc", name: "Technetium", row: 5, col: 7 },
        { n: 44, symbol: "Ru", name: "Ruthenium", row: 5, col: 8 },
        { n: 45, symbol: "Rh", name: "Rhodium", row: 5, col: 9 },
        { n: 46, symbol: "Pd", name: "Palladium", row: 5, col: 10 },
        { n: 47, symbol: "Ag", name: "Silver", row: 5, col: 11 },
        { n: 48, symbol: "Cd", name: "Cadmium", row: 5, col: 12 },
        { n: 49, symbol: "In", name: "Indium", row: 5, col: 13 },
        { n: 50, symbol: "Sn", name: "Tin", row: 5, col: 14 },
        { n: 51, symbol: "Sb", name: "Antimony", row: 5, col: 15 },
        { n: 52, symbol: "Te", name: "Tellurium", row: 5, col: 16 },
        { n: 53, symbol: "I", name: "Iodine", row: 5, col: 17 },
        { n: 54, symbol: "Xe", name: "Xenon", row: 5, col: 18 },
        { n: 55, symbol: "Cs", name: "Cesium", row: 6, col: 1 },
        { n: 56, symbol: "Ba", name: "Barium", row: 6, col: 2 },
        { n: 72, symbol: "Hf", name: "Hafnium", row: 6, col: 4 },
        { n: 73, symbol: "Ta", name: "Tantalum", row: 6, col: 5 },
        { n: 74, symbol: "W", name: "Tungsten", row: 6, col: 6 },
        { n: 75, symbol: "Re", name: "Rhenium", row: 6, col: 7 },
        { n: 76, symbol: "Os", name: "Osmium", row: 6, col: 8 },
        { n: 77, symbol: "Ir", name: "Iridium", row: 6, col: 9 },
        { n: 78, symbol: "Pt", name: "Platinum", row: 6, col: 10 },
        { n: 79, symbol: "Au", name: "Gold", row: 6, col: 11 },
        { n: 80, symbol: "Hg", name: "Mercury", row: 6, col: 12 },
        { n: 81, symbol: "Tl", name: "Thallium", row: 6, col: 13 },
        { n: 82, symbol: "Pb", name: "Lead", row: 6, col: 14 },
        { n: 83, symbol: "Bi", name: "Bismuth", row: 6, col: 15 },
        { n: 84, symbol: "Po", name: "Polonium", row: 6, col: 16 },
        { n: 85, symbol: "At", name: "Astatine", row: 6, col: 17 },
        { n: 86, symbol: "Rn", name: "Radon", row: 6, col: 18 },
        { n: 87, symbol: "Fr", name: "Francium", row: 7, col: 1 },
        { n: 88, symbol: "Ra", name: "Radium", row: 7, col: 2 },
        { n: 104, symbol: "Rf", name: "Rutherfordium", row: 7, col: 4 },
        { n: 105, symbol: "Db", name: "Dubnium", row: 7, col: 5 },
        { n: 106, symbol: "Sg", name: "Seaborgium", row: 7, col: 6 },
        { n: 107, symbol: "Bh", name: "Bohrium", row: 7, col: 7 },
        { n: 108, symbol: "Hs", name: "Hassium", row: 7, col: 8 },
        { n: 109, symbol: "Mt", name: "Meitnerium", row: 7, col: 9 },
        { n: 110, symbol: "Ds", name: "Darmstadtium", row: 7, col: 10 },
        { n: 111, symbol: "Rg", name: "Roentgenium", row: 7, col: 11 },
        { n: 112, symbol: "Cn", name: "Copernicium", row: 7, col: 12 },
        { n: 113, symbol: "Nh", name: "Nihonium", row: 7, col: 13 },
        { n: 114, symbol: "Fl", name: "Flerovium", row: 7, col: 14 },
        { n: 115, symbol: "Mc", name: "Moscovium", row: 7, col: 15 },
        { n: 116, symbol: "Lv", name: "Livermorium", row: 7, col: 16 },
        { n: 117, symbol: "Ts", name: "Tennessine", row: 7, col: 17 },
        { n: 118, symbol: "Og", name: "Oganesson", row: 7, col: 18 },
        { n: 57, symbol: "La", name: "Lanthanum", row: 9, col: 4 },
        { n: 58, symbol: "Ce", name: "Cerium", row: 9, col: 5 },
        { n: 59, symbol: "Pr", name: "Praseodymium", row: 9, col: 6 },
        { n: 60, symbol: "Nd", name: "Neodymium", row: 9, col: 7 },
        { n: 61, symbol: "Pm", name: "Promethium", row: 9, col: 8 },
        { n: 62, symbol: "Sm", name: "Samarium", row: 9, col: 9 },
        { n: 63, symbol: "Eu", name: "Europium", row: 9, col: 10 },
        { n: 64, symbol: "Gd", name: "Gadolinium", row: 9, col: 11 },
        { n: 65, symbol: "Tb", name: "Terbium", row: 9, col: 12 },
        { n: 66, symbol: "Dy", name: "Dysprosium", row: 9, col: 13 },
        { n: 67, symbol: "Ho", name: "Holmium", row: 9, col: 14 },
        { n: 68, symbol: "Er", name: "Erbium", row: 9, col: 15 },
        { n: 69, symbol: "Tm", name: "Thulium", row: 9, col: 16 },
        { n: 70, symbol: "Yb", name: "Ytterbium", row: 9, col: 17 },
        { n: 71, symbol: "Lu", name: "Lutetium", row: 9, col: 18 },
        { n: 89, symbol: "Ac", name: "Actinium", row: 10, col: 4 },
        { n: 90, symbol: "Th", name: "Thorium", row: 10, col: 5 },
        { n: 91, symbol: "Pa", name: "Protactinium", row: 10, col: 6 },
        { n: 92, symbol: "U", name: "Uranium", row: 10, col: 7 },
        { n: 93, symbol: "Np", name: "Neptunium", row: 10, col: 8 },
        { n: 94, symbol: "Pu", name: "Plutonium", row: 10, col: 9 },
        { n: 95, symbol: "Am", name: "Americium", row: 10, col: 10 },
        { n: 96, symbol: "Cm", name: "Curium", row: 10, col: 11 },
        { n: 97, symbol: "Bk", name: "Berkelium", row: 10, col: 12 },
        { n: 98, symbol: "Cf", name: "Californium", row: 10, col: 13 },
        { n: 99, symbol: "Es", name: "Einsteinium", row: 10, col: 14 },
        { n: 100, symbol: "Fm", name: "Fermium", row: 10, col: 15 },
        { n: 101, symbol: "Md", name: "Mendelevium", row: 10, col: 16 },
        { n: 102, symbol: "No", name: "Nobelium", row: 10, col: 17 },
        { n: 103, symbol: "Lr", name: "Lawrencium", row: 10, col: 18 }
    ];

    const elementSymbols = elements.map((element) => element.symbol);
    const elementEdges = [
        "K", "L", "L1", "L2", "L3", "M", "M1", "M2", "M3", "M4", "M5",
        "N", "N1", "N2", "N3", "N4", "N5", "N6", "N7", "O", "O1", "O2", "O3", "O4", "O5", "O6", "O7"
    ];
    const monoNameOptions = ["311", "111", "220"];
    const plottedSpectra = new Map();

    function beamlineById(id) {
        return beamlines.find((beamline) => beamline.id === id);
    }

    function beamlineByName(name) {
        return beamlines.find((beamline) => beamline.name === name);
    }

    function beamlineFromFacility(facilityName) {
        const normalized = (facilityName || "").trim().toUpperCase();
        return beamlines.find((beamline) => beamline.facility === normalized)?.name || "N/A";
    }

    function rootPrefix() {
        return window.location.pathname.includes("/pages/") ? "../../" : "./";
    }

    function readXDIField(text, fieldName) {
        const fieldKey = fieldName.toLowerCase();
        const line = text.split(/\r?\n/).find((item) => {
            const content = item.replace(/^#\s?/, "").trim();
            return content.toLowerCase().startsWith(`${fieldKey}:`);
        });

        return line ? line.replace(/^#\s?/, "").split(":").slice(1).join(":").trim() : "";
    }

    function parseMetadata(text) {
        const facilityName = readXDIField(text, "facility.name");
        const mono = readXDIField(text, "mono.name") || "N/A";

        return {
            facilityName: facilityName || "N/A",
            beamline: beamlineFromFacility(facilityName),
            symbol: readXDIField(text, "element.symbol") || "N/A",
            edge: readXDIField(text, "element.edge") || "N/A",
            mono,
            monoReflection: normalizeMonoReflection(mono),
            temperature: readXDIField(text, "sample.temperature") || "N/A"
        };
    }

    function parsePoints(text) {
        return text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"))
            .map((line) => line.split(/\s+/).map(Number))
            .filter((columns) => columns.length >= 2 && Number.isFinite(columns[0]) && Number.isFinite(columns[1]))
            .map(([energy, mutrans]) => ({ energy, mutrans }));
    }

    function normalizeMonoReflection(value) {
        const match = (value || "").match(/(?:Si)?\s*\(?\s*(111|220|311)\s*\)?/i);
        return match ? match[1] : "N/A";
    }

    function metadataRows(metadata = {}) {
        return [
            ["Element.symbol", metadata.symbol || "N/A"],
            ["Element.edge", metadata.edge || "N/A"],
            ["Mono.name", metadata.mono || "N/A"],
            ["Sample.temperature", metadata.temperature || "N/A"]
        ];
    }

    function renderMetadata(container, metadata = {}) {
        container.replaceChildren(...metadataRows(metadata).map(([label, value]) => {
            const row = document.createElement("div");
            const term = document.createElement("dt");
            const detail = document.createElement("dd");

            term.textContent = label;
            detail.textContent = value;
            row.append(term, detail);
            return row;
        }));
    }

    function spectrumEntryFromFile(file) {
        return {
            beamline: file.metadata?.beamline || "N/A",
            file: file.fileName || file.file || "N/A",
            href: file.objectUrl || file.href || "#",
            text: file.text || "",
            metadata: file.metadata || parseMetadata(file.text || ""),
            points: file.points || parsePoints(file.text || "")
        };
    }

    function normalizeEntry(entry) {
        const metadata = entry.metadata || {
            symbol: entry.symbol,
            edge: entry.edge,
            mono: entry.mono,
            monoReflection: entry.monoReflection,
            temperature: entry.temperature
        };

        return {
            ...entry,
            file: entry.file || entry.fileName,
            beamline: entry.beamline || metadata.beamline || "N/A",
            metadata: {
                ...metadata,
                monoReflection: metadata.monoReflection || normalizeMonoReflection(metadata.mono)
            },
            points: entry.points || parsePoints(entry.text || "")
        };
    }

    function createSpectrumCard(rawEntry, options = {}) {
        const entry = normalizeEntry(rawEntry);
        const card = document.createElement("article");
        card.className = `file-card${options.className ? ` ${options.className}` : ""}`;

        const header = document.createElement("div");
        header.className = "file-card-header";

        const title = document.createElement("h3");
        title.textContent = entry.file || "N/A";
        header.appendChild(title);

        if (options.status) {
            const status = document.createElement("p");
            status.className = "upload-review-status";
            status.textContent = options.status;
            header.appendChild(status);
        } else {
            const download = document.createElement("a");
            download.className = "download-button";
            download.href = entry.href || "#";
            download.download = entry.file || "spectrum.xdi";
            download.textContent = "Download File";
            download.setAttribute("aria-label", `Download File ${entry.file || "spectrum"}`);
            header.appendChild(download);
        }

        const beamline = document.createElement("p");
        beamline.className = "card-beamline";
        beamline.textContent = entry.beamline || "N/A";

        const metadata = document.createElement("dl");
        metadata.className = "file-metadata";
        renderMetadata(metadata, entry.metadata);

        const plotWrap = document.createElement("div");
        plotWrap.className = "mini-plot";

        const plot = svgElement("svg", {
            "aria-label": `Plot of mu trans as a function of energy for ${entry.file || "spectrum"}`,
            "role": "img",
            "viewBox": "0 0 640 315",
            "preserveAspectRatio": "xMidYMid meet"
        });
        plotWrap.appendChild(plot);

        card.append(header, beamline, metadata, plotWrap);
        requestAnimationFrame(() => drawSpectrum(plot, entry.points));
        return card;
    }

    async function loadAllSpectra(root = "./") {
        const groups = await Promise.all(beamlines.map((beamline) => loadBeamlineSpectra(beamline, root)));
        return groups.flat();
    }

    async function loadBeamlineSpectra(beamline, root = "./") {
        const manifestUrl = `${root}pages/${beamline.id}/manifest.json`;
        const manifest = await fetchJson(manifestUrl);
        const fileBase = `${root}pages/${beamline.id}/files/`;
        const files = Object.values(manifest).flat();

        return Promise.all(files.map(async (item) => {
            const fileName = item.file.trim();
            const href = `${fileBase}${encodeURIComponent(fileName)}`;
            const text = await fetchText(href);
            const metadata = parseMetadata(text);

            return {
                beamline: beamline.name,
                file: fileName,
                href,
                text,
                metadata,
                symbol: metadata.symbol,
                edge: metadata.edge,
                mono: metadata.mono,
                monoReflection: metadata.monoReflection,
                temperature: metadata.temperature,
                points: parsePoints(text)
            };
        }));
    }

    function fetchJson(url) {
        return fetch(url).then((response) => {
            if (!response.ok) {
                throw new Error(`Unable to load ${url}`);
            }
            return response.json();
        });
    }

    function fetchText(url) {
        return fetch(url).then((response) => {
            if (!response.ok) {
                throw new Error(`Unable to load ${url}`);
            }
            return response.text();
        });
    }

    function mergeEntries(priorityEntries, existingEntries) {
        const seen = new Set();
        return [...priorityEntries, ...existingEntries].filter((entry) => {
            const key = `${entry.beamline}:${entry.file}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    function uniqueValues(values) {
        return [...new Set(values.filter(Boolean))].sort((a, b) => {
            if (a === "N/A") return 1;
            if (b === "N/A") return -1;
            return a.localeCompare(b, undefined, { numeric: true });
        });
    }

    function compoundCountLabel(count) {
        return `${count} available ${count === 1 ? "compound" : "compounds"}`;
    }

    function downloadSpectraZip(entries) {
        if (!entries.length || typeof window.makeZip !== "function") {
            return;
        }

        const zipBlob = window.makeZip(entries.map((entry) => ({
            path: `reference_compound_spectra/${entry.file || entry.name}`,
            content: entry.text || ""
        })));
        const url = URL.createObjectURL(zipBlob);
        const download = document.createElement("a");

        download.href = url;
        download.download = "reference_compound_spectra.zip";
        document.body.appendChild(download);
        download.click();
        download.remove();
        URL.revokeObjectURL(url);
    }

    function drawSpectrum(plot, points, options = {}) {
        plot.replaceChildren();

        if (!points.length) {
            drawMessage(plot, "No spectrum data found", options);
            return;
        }

        const width = plot.clientWidth || options.width || 640;
        const height = plot.clientHeight || options.height || 315;
        const padding = options.padding || { top: 32, right: 42.5, bottom: 82, left: 88 };
        const axisLabel = options.axisLabel || { xTitleY: height - 22, xTickY: height - 58, yTitleX: 28, yTickGap: 14 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;

        plot.setAttribute("viewBox", `0 0 ${width} ${height}`);

        const xValues = points.map((point) => point.energy);
        const yValues = points.map((point) => point.mutrans);
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        const yRange = yMax - yMin || 1;
        const yPad = yRange * 0.08;

        const x = (value) => padding.left + ((value - xMin) / (xMax - xMin || 1)) * plotWidth;
        const y = (value) => padding.top + (1 - ((value - (yMin - yPad)) / (yRange + yPad * 2))) * plotHeight;
        const xTicks = hundredTicks(xMin, xMax, 3);
        const yTicks = miniTicks(yMin, yMax, 3);
        const classes = {
            grid: options.gridClass || "mini-grid-line",
            line: options.lineClass || "mini-spectrum-line",
            axis: options.axisClass || "mini-axis-label",
            tick: options.tickClass || "mini-tick-label"
        };

        plot.appendChild(svgElement("rect", { width, height, fill: "#ffffff" }));

        xTicks.forEach((tick) => {
            const px = crisp(x(tick));
            plot.appendChild(svgElement("line", {
                x1: px,
                y1: padding.top,
                x2: px,
                y2: height - padding.bottom,
                class: classes.grid
            }));
        });

        yTicks.forEach((tick) => {
            const py = crisp(y(tick));
            plot.appendChild(svgElement("line", {
                x1: padding.left,
                y1: py,
                x2: width - padding.right,
                y2: py,
                class: classes.grid
            }));
        });

        plot.appendChild(svgElement("polyline", {
            points: points.map((point) => `${x(point.energy).toFixed(2)},${y(point.mutrans).toFixed(2)}`).join(" "),
            class: classes.line
        }));

        plot.appendChild(svgText("E (eV)", padding.left + plotWidth / 2, axisLabel.xTitleY, "middle", classes.axis));

        const plotCenterY = padding.top + plotHeight / 2;
        const yTitle = svgText("\u03bc (E)", axisLabel.yTitleX, plotCenterY, "middle", classes.axis);
        yTitle.setAttribute("transform", `rotate(-90 ${axisLabel.yTitleX} ${plotCenterY})`);
        plot.appendChild(yTitle);

        xTicks.forEach((tick) => {
            plot.appendChild(svgText(Math.round(tick).toString(), x(tick), axisLabel.xTickY, "middle", classes.tick));
        });

        yTicks.forEach((tick) => {
            plot.appendChild(svgText(formatTick(tick), padding.left - axisLabel.yTickGap, y(tick) + 4, "end", classes.tick));
        });

        plottedSpectra.set(plot, { points, options });
    }

    function drawMessage(plot, message, options = {}) {
        const width = plot.clientWidth || options.width || 640;
        const height = plot.clientHeight || options.height || 315;

        plot.replaceChildren();
        plot.setAttribute("viewBox", `0 0 ${width} ${height}`);
        plot.appendChild(svgElement("rect", { width, height, fill: "#ffffff" }));
        plot.appendChild(svgText(message, width / 2, height / 2, "middle", options.messageClass || "mini-message"));
    }

    function miniTicks(min, max, count) {
        if (min === max) {
            return [min];
        }
        const step = (max - min) / (count - 1);
        return Array.from({ length: count }, (_, index) => min + step * index);
    }

    function hundredTicks(min, max, count) {
        const step = 100;
        const start = Math.ceil(min / step) * step;
        const end = Math.floor(max / step) * step;
        const ticks = [];

        for (let value = start; value <= end; value += step) {
            ticks.push(value);
        }

        if (ticks.length <= count) {
            return ticks;
        }

        return Array.from({ length: count }, (_, index) => {
            const tickIndex = Math.round(index * (ticks.length - 1) / (count - 1));
            return ticks[tickIndex];
        });
    }

    function formatTick(value) {
        return Number.isInteger(value) ? value.toString() : value.toFixed(1);
    }

    function crisp(value) {
        return Math.round(value) + 0.5;
    }

    function svgElement(name, attributes = {}) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", name);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        return element;
    }

    function svgText(content, x, y, anchor, className) {
        const text = svgElement("text", {
            x,
            y,
            "text-anchor": anchor,
            class: className
        });
        text.textContent = content;
        return text;
    }

    window.addEventListener("resize", () => {
        plottedSpectra.forEach(({ points, options }, plot) => drawSpectrum(plot, points, options));
    });

    window.XAS = {
        beamlines,
        elements,
        elementSymbols,
        elementEdges,
        monoNameOptions,
        beamlineById,
        beamlineByName,
        beamlineFromFacility,
        rootPrefix,
        readXDIField,
        parseMetadata,
        parsePoints,
        normalizeMonoReflection,
        metadataRows,
        renderMetadata,
        spectrumEntryFromFile,
        normalizeEntry,
        createSpectrumCard,
        loadAllSpectra,
        loadBeamlineSpectra,
        fetchJson,
        fetchText,
        mergeEntries,
        uniqueValues,
        compoundCountLabel,
        downloadSpectraZip,
        drawSpectrum,
        drawMessage
    };
}());
