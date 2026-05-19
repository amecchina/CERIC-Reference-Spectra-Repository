/* Minimal ZIP writer used to download matched spectra without server support. */
function downloadSpectraZip(files, zipName = "reference_compound_spectra.zip") {
    if (!files.length) {
        return;
    }

    Promise.all(files.map((file) => fetch(file.url).then((response) => {
        if (!response.ok) {
            throw new Error(`Unable to load ${file.url}`);
        }

        return response.text();
    }).then((content) => ({
        path: `reference_compound_spectra/${file.name}`,
        content
    })))).then((entries) => {
        const zipBlob = makeZip(entries);
        const url = URL.createObjectURL(zipBlob);
        const download = document.createElement("a");

        download.href = url;
        download.download = zipName;
        document.body.appendChild(download);
        download.click();
        download.remove();
        URL.revokeObjectURL(url);
    });
}

function makeZip(files) {
    const encoder = new TextEncoder();
    const chunks = [];
    const centralDirectory = [];
    let offset = 0;

    files.forEach((file) => {
        const name = encoder.encode(file.path);
        const data = encoder.encode(file.content);
        const crc = crc32(data);
        const localHeader = concatBytes(
            uint32(0x04034b50),
            uint16(20),
            uint16(0x0800),
            uint16(0),
            uint16(0),
            uint16(0),
            uint32(crc),
            uint32(data.length),
            uint32(data.length),
            uint16(name.length),
            uint16(0),
            name
        );

        chunks.push(localHeader, data);
        centralDirectory.push({ name, crc, size: data.length, offset });
        offset += localHeader.length + data.length;
    });

    const centralStart = offset;

    centralDirectory.forEach((entry) => {
        const header = concatBytes(
            uint32(0x02014b50),
            uint16(20),
            uint16(20),
            uint16(0x0800),
            uint16(0),
            uint16(0),
            uint16(0),
            uint32(entry.crc),
            uint32(entry.size),
            uint32(entry.size),
            uint16(entry.name.length),
            uint16(0),
            uint16(0),
            uint16(0),
            uint16(0),
            uint32(0),
            uint32(entry.offset),
            entry.name
        );

        chunks.push(header);
        offset += header.length;
    });

    chunks.push(concatBytes(
        uint32(0x06054b50),
        uint16(0),
        uint16(0),
        uint16(centralDirectory.length),
        uint16(centralDirectory.length),
        uint32(offset - centralStart),
        uint32(centralStart),
        uint16(0)
    ));

    return new Blob(chunks, { type: "application/zip" });
}

function crc32(data) {
    let crc = 0xffffffff;

    data.forEach((byte) => {
        crc ^= byte;
        for (let index = 0; index < 8; index += 1) {
            crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
    });

    return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value) {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, true);
    return bytes;
}

function uint32(value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
    return bytes;
}

function concatBytes(...parts) {
    const length = parts.reduce((total, part) => total + part.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;

    parts.forEach((part) => {
        result.set(part, offset);
        offset += part.length;
    });

    return result;
}
