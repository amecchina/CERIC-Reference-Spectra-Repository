/* Draws the fixed Cu2S example shown on the landing page. */
(function () {
    const plot = document.querySelector("#spectrum-plot");
    const metadataList = document.querySelector("#spectrum-metadata");
    const beamlineLabel = document.querySelector("#spectrum-beamline");
    const previewSpectrumPath = "./pages/lisa-esrf/files/Cu2S_111.xdi";
    let previewPoints = [];

    XAS.fetchText(previewSpectrumPath)
        .then((text) => {
            const metadata = XAS.parseMetadata(text);
            previewPoints = XAS.parsePoints(text);
            beamlineLabel.textContent = metadata.beamline;
            XAS.renderMetadata(metadataList, metadata);
            drawPreview();
        })
        .catch(() => {
            beamlineLabel.textContent = "LISA@ESRF";
            XAS.renderMetadata(metadataList, {
                symbol: "Cu",
                edge: "K",
                mono: "Si(111)",
                temperature: "300 K"
            });
            XAS.drawMessage(plot, "Cu2S_111.xdi not available", { messageClass: "spectrum-message" });
        });

    function drawPreview() {
        XAS.drawSpectrum(plot, previewPoints, {
            gridClass: "spectrum-grid-line",
            lineClass: "spectrum-line",
            axisClass: "spectrum-axis-label",
            tickClass: "spectrum-tick-label",
            messageClass: "spectrum-message",
            padding: { top: 20, right: 16, bottom: 66, left: 80 },
            axisLabel: {
                xTitleY: (plot.clientHeight || 300) - 8,
                xTickY: (plot.clientHeight || 300) - 41,
                yTitleX: 20,
                yTickGap: 14
            }
        });
    }
}());
