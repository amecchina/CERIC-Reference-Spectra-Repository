/* Client-side upload preview. In this static site uploads are kept in sessionStorage only. */
(function () {
    const uploadStorageKey = "reference-spectra-uploaded-xdi";
    let existingSpectraCache = null;

    localStorage.removeItem(uploadStorageKey);

    document.querySelectorAll(".upload-button input[type='file']").forEach((input) => {
        input.addEventListener("change", async () => {
            const files = Array.from(input.files || []);
            input.value = "";

            if (!files.length) {
                return;
            }

            const xdiFiles = files.filter((file) => file.name.toLowerCase().endsWith(".xdi"));

            if (!xdiFiles.length) {
                window.alert("No XDI file selected.");
                return;
            }

            const uploadedSpectra = await Promise.all(xdiFiles.map(readUploadFile));
            const validationError = await validateUploadedSpectra(uploadedSpectra);

            if (validationError) {
                window.alert(validationError);
                return;
            }

            showUploadReview(uploadedSpectra);
        });
    });

    async function readUploadFile(file) {
        try {
            const text = await file.text();
            return {
                fileName: file.name.trim(),
                objectUrl: URL.createObjectURL(file),
                text,
                metadata: XAS.parseMetadata(text),
                points: XAS.parsePoints(text),
                error: ""
            };
        } catch {
            return {
                fileName: file.name.trim(),
                objectUrl: "",
                text: "",
                metadata: emptyMetadata(),
                points: [],
                error: "Unable to read file"
            };
        }
    }

    function emptyMetadata() {
        return {
            facilityName: "N/A",
            beamline: "N/A",
            symbol: "N/A",
            edge: "N/A",
            mono: "N/A",
            monoReflection: "N/A",
            temperature: "N/A"
        };
    }

    async function validateUploadedSpectra(files) {
        const pageBeamline = currentBeamlinePageName();
        const seenUploadTexts = new Map();
        const seenUploadNames = new Set();

        for (const file of files) {
            if (file.error) {
                return `Upload interrupted: ${file.fileName} could not be read.`;
            }

            const fileBeamline = file.metadata.beamline;

            if (isBeamlinePage(pageBeamline) && fileBeamline !== pageBeamline) {
                return `Upload interrupted: file ${file.fileName} belongs to the ${fileBeamline} repository, but this page is for ${pageBeamline}.`;
            }

            const normalizedText = normalizeXDIText(file.text);
            const normalizedFileName = normalizeFileName(file.fileName);

            if (seenUploadNames.has(normalizedFileName) || seenUploadTexts.has(normalizedText)) {
                return duplicateUploadMessage(file.fileName, pageBeamline);
            }

            seenUploadNames.add(normalizedFileName);
            seenUploadTexts.set(normalizedText, file.fileName);

            const duplicate = await findDuplicateSpectrum(file);

            if (duplicate) {
                return duplicateUploadMessage(file.fileName, pageBeamline);
            }
        }

        return "";
    }

    function currentBeamlinePageName() {
        return document.body.dataset.beamlineName || "";
    }

    function isBeamlinePage(pageBeamline) {
        return XAS.beamlines.some((beamline) => beamline.name === pageBeamline);
    }

    function duplicateUploadMessage(fileName, pageBeamline) {
        return isBeamlinePage(pageBeamline)
            ? `Upload interrupted: file ${fileName} already exists in the ${pageBeamline} repository.`
            : `Upload interrupted: ${fileName} already exists in the repository.`;
    }

    async function findDuplicateSpectrum(file) {
        const normalizedText = normalizeXDIText(file.text);
        const normalizedFileName = normalizeFileName(file.fileName);
        const storedDuplicate = getStoredUploadedSpectra().find((item) => (
            normalizeFileName(item.fileName) === normalizedFileName ||
            normalizeXDIText(item.text) === normalizedText
        ));

        if (storedDuplicate) {
            return storedDuplicate.fileName;
        }

        const existingSpectra = await loadExistingSpectraTexts();
        const duplicate = existingSpectra.find((item) => (
            normalizeFileName(item.fileName) === normalizedFileName ||
            normalizeXDIText(item.text) === normalizedText
        ));
        return duplicate ? duplicate.fileName : "";
    }

    function normalizeXDIText(text) {
        return text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
    }

    function normalizeFileName(fileName) {
        return fileName.trim().toLowerCase();
    }

    async function loadExistingSpectraTexts() {
        if (existingSpectraCache) {
            return existingSpectraCache;
        }

        existingSpectraCache = Promise.all(XAS.beamlines.map(loadManifestFiles))
            .then((groups) => groups.flat())
            .catch(() => []);

        return existingSpectraCache;
    }

    async function loadManifestFiles(beamline) {
        try {
            const root = XAS.rootPrefix();
            const manifestUrl = `${root}pages/${beamline.id}/manifest.json`;
            const manifest = await XAS.fetchJson(manifestUrl);
            const filesBase = `${root}pages/${beamline.id}/files/`;
            const entries = Object.values(manifest).flat();

            return Promise.all(entries.map(async (entry) => {
                const fileName = entry.file.trim();
                const text = await XAS.fetchText(`${filesBase}${encodeURIComponent(fileName)}`);
                return { fileName, text };
            }));
        } catch {
            return [];
        }
    }

    function showUploadReview(files) {
        document.querySelector(".upload-review-overlay")?.remove();

        const overlay = document.createElement("div");
        overlay.className = "upload-review-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "upload-review-title");

        const dialog = document.createElement("section");
        dialog.className = "upload-review-dialog";
        dialog.tabIndex = -1;

        const header = document.createElement("div");
        header.className = "upload-review-header";

        const title = document.createElement("h2");
        title.id = "upload-review-title";
        title.textContent = "Confirm XDI metadata";

        const cancel = document.createElement("button");
        cancel.className = "download-button upload-review-cancel";
        cancel.type = "button";
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => overlay.remove());

        header.append(title, cancel);

        const note = document.createElement("p");
        note.className = "upload-review-note";
        note.textContent = `${files.length} XDI ${files.length === 1 ? "file" : "files"} ready for review.`;

        const list = document.createElement("div");
        list.className = "upload-review-list";
        files.forEach((file) => list.appendChild(uploadReviewCard(file)));

        const actions = document.createElement("div");
        actions.className = "upload-review-actions";

        const confirm = document.createElement("button");
        confirm.className = "download-button";
        confirm.type = "button";
        confirm.textContent = "Confirm Upload";
        confirm.addEventListener("click", () => {
            storeUploadedSpectra(files);
            overlay.remove();
            addUploadedSpectra(files);
        });

        actions.appendChild(confirm);
        dialog.append(header, note, list, actions);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        dialog.focus();
    }

    function uploadReviewCard(file) {
        return XAS.createSpectrumCard(XAS.spectrumEntryFromFile(file), {
            status: file.error || "Ready",
            className: "upload-review-card"
        });
    }

    function addUploadedSpectra(files) {
        if (typeof window.addUploadedSpectraToSearch === "function") {
            window.addUploadedSpectraToSearch(files);
            return;
        }

        if (typeof window.addUploadedSpectraToBeamline === "function") {
            window.addUploadedSpectraToBeamline(files);
        }
    }

    function storeUploadedSpectra(files) {
        const existingUploads = getStoredUploadedSpectra();
        const uploadMap = new Map(existingUploads.map((file) => [`${file.metadata.beamline}:${file.fileName}`, file]));

        files
            .filter((file) => file.text && !file.error)
            .forEach((file) => {
                uploadMap.set(`${file.metadata.beamline}:${file.fileName}`, {
                    fileName: file.fileName,
                    text: file.text,
                    metadata: file.metadata
                });
            });

        try {
            sessionStorage.setItem(uploadStorageKey, JSON.stringify(Array.from(uploadMap.values())));
            window.dispatchEvent(new CustomEvent("uploaded-spectra-updated"));
        } catch {
            window.alert("The file was added to this page, but the browser could not keep it available across pages.");
        }
    }

    function getStoredUploadedSpectra() {
        try {
            const uploads = JSON.parse(sessionStorage.getItem(uploadStorageKey) || "[]");
            return Array.isArray(uploads)
                ? uploads.map((file) => ({
                    ...file,
                    objectUrl: URL.createObjectURL(new Blob([file.text || ""], { type: "text/plain" })),
                    points: XAS.parsePoints(file.text || "")
                }))
                : [];
        } catch {
            return [];
        }
    }

    window.getStoredUploadedSpectra = getStoredUploadedSpectra;
}());
