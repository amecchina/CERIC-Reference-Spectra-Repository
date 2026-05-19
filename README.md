# CERIC Reference Spectra Repository

Static website for accessing X-ray Absorption Spectroscopy (XAS) reference spectra from CERIC beamlines.

Note: files from the XAS@ELETTRA and ASTRA@SOLARIS beamlines expose metadata only; numerical data columns are restricted.

## Structure

```text
website/
  index.html                  Landing page, global metadata search, upload preview
  catalog.json                Static API entry point for beamlines and manifests
  assets/
    css/                      Shared styles
    js/                       Shared parsing, plotting, upload, search, ZIP logic
    images/                   CERIC logo and favicon
  notebooks/
    basic_python_api_usage.ipynb Python API example notebook
  pages/
    lisa-esrf/                LISA@ESRF page, manifest, and XDI files
    xas-elettra/              XAS@ELETTRA page, manifest, and XDI files
    astra-solaris/            ASTRA@SOLARIS page, manifest, and XDI files
ceric_xas/
  client.py                   Python client for the static API
```

Each beamline folder contains:

- `index.html`: periodic-table interface for that beamline;
- `manifest.json`: element-to-file index used by the static app;
- `files/`: XDI spectra for the beamline.

## Local Use

Open a terminal in the `website/` folder.

Example:

```bash
cd /path/to/MDMC/website
```

Start a local static server from that folder:

```bash
python3 -m http.server 8000
```

Then open the website at:

```text
http://localhost:8000/
```

The `website/` folder is used as the server root because it contains every file
the static site must serve, including the downloadable notebook in
`website/notebooks/`. If port `8000` is already busy, choose another port:

```bash
python3 -m http.server 8001
```

and open:

```text
http://localhost:8001/
```

## Static API

The website can also be used as a read-only static API:

- `catalog.json`: beamline list and manifest locations;
- `pages/{beamline}/manifest.json`: element-to-file index for one beamline;
- `pages/{beamline}/files/{file}`: direct XDI file download.

There is no Python server behind this API. It is local when served with
`python3 -m http.server`, and public when the `website/` folder is published on
a static host such as GitHub Pages or an institutional web server.

The Python client exposes the same homepage search fields, in snake_case:

- `element_symbol` from `Element.symbol`;
- `element_edge` from `Element.edge`;
- `mono_name` from `Mono.name`; search accepts the homepage selector values (`311`, `111`, `220`);
- `sample_temperature` from `Sample.temperature`;
- `beamline`.

Example Python usage with the local package:

```python
from ceric_xas import Client

client = Client("http://localhost:8000")
client.beamlines()
client.files(beamline="LISA@ESRF", element_symbol="Ni")
client.search(
    element_symbol="Ni",
    element_edge="any",
    mono_name="111",
    sample_temperature="any",
    beamline="LISA@ESRF",
)
client.download_search(
    element_symbol="Ni",
    element_edge="any",
    mono_name="111",
    sample_temperature="any",
    beamline="LISA@ESRF",
    out_dir="downloads",
)
```

A basic Python API notebook is available at `notebooks/basic_python_api_usage.ipynb`
inside the `website/` folder, and the homepage links directly to it.

The notebook uses the `ceric_xas` Python API for catalog loading, metadata
search, downloads, and XDI reads, and uses `matplotlib` for plotting. Before
running it, start the Python kernel from the repository root when possible. In
that setup, `from ceric_xas import Client` can work without installation because
Python can see the local `ceric_xas/` folder. If the import fails, run the
installation commands shown in the notebook from the repository root:
`python3 -m pip install -e .` and `python3 -m pip install matplotlib`. The
editable install makes the local API package importable from the notebook. To
reuse it with a different deployment, change its `BASE_URL` value to the
published website root.

For plotting or numerical work, the API also exposes `parse_xdi()`, which parses
XDI text once and returns an `XDIFile` object. Metadata are available as a
dictionary of keys and values in `xdi.metadata`; parsed column indexes and names
are available in `xdi.columns`; all numeric data columns are preserved in
`xdi.rows`. This keeps files with a third numeric column or more usable without
losing the column names from the XDI header. For the common plot case,
`xdi.points` returns the first two numeric columns as `(energy, mutrans)` points.
If you do not need the raw text, `client.read_xdi()` downloads a file once and
returns the parsed result directly. For convenience, `parse_xdi_metadata()`,
`parse_xdi_points()`, `client.read_metadata()`, and `client.read_points()` are
also available when you only need one output.

## Adding Spectra

For permanent repository updates:

1. Put the `.xdi` file in the correct beamline `files/` folder;
2. Add the file to that beamline `manifest.json` under the correct element symbol;
3. Confirm these XDI metadata fields are present when available:
   - `Facility.name`;
   - `Element.symbol`;
   - `Element.edge`;
   - `Mono.name`;
   - `Sample.temperature`.

The in-browser upload button is a preview workflow only. It validates metadata,
shows a card and plot preview, and stores accepted files in `sessionStorage` for
the current browser session. It does not write files into the repository.

The root-level `Ni_foil_111.xdi` file is intentionally kept outside the
beamline folders as a manual test file for the upload preview workflow. It is
not part of any permanent beamline manifest.

To add that file manually as permanent LISA@ESRF data:

1. Copy `../Ni_foil_111.xdi` into `pages/lisa-esrf/files/Ni_foil_111.xdi`;
2. Open `pages/lisa-esrf/manifest.json` and add the file under the existing
   `Ni` array:

   ```json
   {
     "file": "Ni_foil_111.xdi"
   }
   ```

3. Keep the JSON comma placement valid around the new object;
4. Confirm that the file metadata still includes `Facility.name: ESRF`,
   `Element.symbol: Ni`, `Element.edge: K`, `Mono.name: Si(111)`, and
   `Sample.temperature: 300 K`;
5. Reload the static site; the Ni entry will be discoverable from the LISA@ESRF
   page and from the homepage metadata search.

## Beamline Mapping

Upload validation maps `Facility.name` to repositories as follows:

- `ESRF` -> `LISA@ESRF`;
- `ELETTRA` -> `XAS@ELETTRA`;
- `SOLARIS` -> `ASTRA@SOLARIS`.

## Important Files

- `assets/js/xdi-common.js`: shared beamline definitions, XDI parser, plotter,
  metadata rendering, card rendering, and manifest loaders;
- `assets/js/beamline-page.js`: reusable periodic-table page controller;
- `assets/js/search.js`: landing-page metadata search;
- `assets/js/upload.js`: client-side upload validation and preview;
- `assets/css/base.css`: shared design tokens and global primitives;
- `assets/css/cards.css`: shared spectrum cards and upload dialog;
- `assets/css/beamline.css`: shared beamline-page layout;
- `assets/css/home.css`: landing-page layout.

## Authors

- Andrea Mecchina (SISSA, AREA Science Park);
- Alessandro Puri (University of Bologna);
- Giovanni Agostini (Elettra Sincrotrone Trieste);
- Alexey Maximenko (SOLARIS National Synchrotron Radiation Centre);
- Francesco D'Acapito (CNR-IOM-OGG c/o ESRF).

## Credits

Based on the LISA XAS Repository by Alessandro Puri. Original repository DOI:
<https://doi.org/10.5281/zenodo.10778098>.

## License

Website code is distributed under the MIT License. Spectral data are distributed
under the Creative Commons Attribution 4.0 International License (CC BY 4.0);
see `DATA_LICENSE.md`.
