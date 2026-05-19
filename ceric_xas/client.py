"""Minimal client for downloading and searching XDI spectra from the website."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional, Union
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urljoin
from urllib.request import urlopen
import json

XDIPoint = tuple[float, float]


@dataclass(frozen=True)
class XDIColumn:
    """Description of one numeric XDI data column."""

    index: int
    name: str


@dataclass(frozen=True)
class XDIFile:
    """Parsed XDI content with metadata, columns, and numeric rows."""

    metadata: dict[str, str]
    columns: list[XDIColumn]
    rows: list[tuple[float, ...]]

    @property
    def points(self) -> list[XDIPoint]:
        """Return the first two numeric columns as ``(energy, mutrans)``."""

        return [(row[0], row[1]) for row in self.rows if len(row) >= 2]

    @property
    def column_names(self) -> list[str]:
        """Return the parsed XDI data column names."""

        return [column.name for column in self.columns]


@dataclass(frozen=True)
class Beamline:
    """A beamline exposed by the static catalog."""

    id: str
    name: str
    facility: str
    manifest: str
    files: str


@dataclass(frozen=True)
class Spectrum:
    """A searchable and downloadable spectrum entry."""

    beamline_id: str
    beamline: str
    file: str
    url: str
    facility_name: str
    element_symbol: str
    element_edge: str
    mono_name: str
    sample_temperature: str


class Client:
    """Client for the repository's JSON manifests and XDI files.

    Parameters
    ----------
    base_url:
        Root URL of the published portal, for example
        ``"https://example.org"`` or ``"http://localhost:8000"``.
    """

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/") + "/"
        self._catalog_cache: Optional[dict[str, Any]] = None
        self._manifest_cache: dict[str, dict[str, list[dict[str, str]]]] = {}
        self._spectra_cache: dict[str, list[Spectrum]] = {}

    def catalog(self) -> dict[str, Any]:
        """Return the top-level static catalog."""

        if self._catalog_cache is None:
            self._catalog_cache = self._get_json("catalog.json")
        return self._catalog_cache

    def beamlines(self) -> list[Beamline]:
        """Return all beamlines listed by the catalog."""

        beamlines = self.catalog().get("beamlines", {})
        return [
            Beamline(
                id=beamline_id,
                name=item["name"],
                facility=item["facility"],
                manifest=item["manifest"],
                files=item["files"],
            )
            for beamline_id, item in beamlines.items()
        ]

    def manifest(self, beamline: str) -> dict[str, list[dict[str, str]]]:
        """Return the manifest for one beamline."""

        if beamline in self._manifest_cache:
            return self._manifest_cache[beamline]

        info = self._beamline_info(beamline)
        manifest = self._get_json(info["manifest"])
        self._manifest_cache[beamline] = manifest
        return manifest

    def files(self, beamline: str, element_symbol: Optional[str] = None) -> list[Spectrum]:
        """List searchable files for a beamline, optionally filtered by element."""

        spectra = self.spectra(beamline)
        if element_symbol is None:
            return spectra
        return [item for item in spectra if _same_value(item.element_symbol, element_symbol)]

    def spectra(self, beamline: Optional[str] = None) -> list[Spectrum]:
        """Return searchable spectra, preserving the website's filter order."""

        beamline_ids = [self._beamline_id(beamline)] if beamline else [item.id for item in self.beamlines()]
        results: list[Spectrum] = []

        for beamline_id in beamline_ids:
            if beamline_id not in self._spectra_cache:
                self._spectra_cache[beamline_id] = self._load_spectra(beamline_id)
            results.extend(self._spectra_cache[beamline_id])

        return results

    def search(
        self,
        element_symbol: Optional[str] = None,
        element_edge: Optional[str] = None,
        mono_name: Optional[str] = None,
        sample_temperature: Optional[str] = None,
        beamline: Optional[str] = None,
    ) -> list[Spectrum]:
        """Search spectra with the same filters and order used by the homepage.

        ``mono_name`` follows the homepage selector, so it accepts
        ``"311"``, ``"111"``, or ``"220"`` and compares them against the
        normalized `Mono.name` reflection.
        Filter values are case-insensitive; omitted filters, empty strings,
        ``"any"``, and ``"Any"`` all behave like the homepage `Any` option.
        """

        beamline_filter = None if _is_any(beamline) else beamline
        mono_filter = None if _is_any(mono_name) else _normalize_mono_name(mono_name or "")
        spectra = self.spectra(beamline_filter) if beamline_filter else self.spectra()

        return [
            item
            for item in spectra
            if self._matches_beamline(item, beamline_filter)
            and self._matches(item.element_symbol, element_symbol)
            and self._matches(item.element_edge, element_edge)
            and self._matches(_normalize_mono_name(item.mono_name), mono_filter)
            and self._matches(item.sample_temperature, sample_temperature)
        ]

    def file_url(self, beamline: str, file: str) -> str:
        """Build the URL for a spectrum file."""

        info = self._beamline_info(beamline)
        return urljoin(self.base_url, info["files"] + quote(file))

    def download(
        self,
        beamline: str,
        file: str,
        out_dir: Union[str, Path] = ".",
        overwrite: bool = False,
    ) -> Path:
        """Download one spectrum file and return the local path."""

        target = Path(out_dir) / file
        target.parent.mkdir(parents=True, exist_ok=True)

        if target.exists() and not overwrite:
            return target

        target.write_bytes(self._get_bytes(self.file_url(beamline, file)))
        return target

    def download_element(
        self,
        beamline: str,
        element_symbol: str,
        out_dir: Union[str, Path] = ".",
        overwrite: bool = False,
    ) -> list[Path]:
        """Download every spectrum for one element in one beamline."""

        return [
            self.download(item.beamline, item.file, out_dir, overwrite=overwrite)
            for item in self.files(beamline, element_symbol)
        ]

    def download_search(
        self,
        element_symbol: Optional[str] = None,
        element_edge: Optional[str] = None,
        mono_name: Optional[str] = None,
        sample_temperature: Optional[str] = None,
        beamline: Optional[str] = None,
        out_dir: Union[str, Path] = ".",
        overwrite: bool = False,
    ) -> list[Path]:
        """Download every spectrum matching the homepage-style search filters.

        Omitted filters, empty strings, ``"any"``, and ``"Any"`` behave like
        the homepage dropdown value `Any`.
        """

        return [
            self.download(item.beamline_id, item.file, out_dir, overwrite=overwrite)
            for item in self.search(
                element_symbol=element_symbol,
                element_edge=element_edge,
                mono_name=mono_name,
                sample_temperature=sample_temperature,
                beamline=beamline,
            )
        ]

    def read_text(self, beamline: str, file: str, encoding: str = "utf-8") -> str:
        """Read a remote XDI file as text without saving it."""

        return self._get_bytes(self.file_url(beamline, file)).decode(encoding)

    def read_points(self, beamline: str, file: str) -> list[XDIPoint]:
        """Read a remote XDI file and return ``(energy, mutrans)`` points."""

        return self.read_xdi(beamline, file).points

    def read_metadata(self, beamline: str, file: str) -> dict[str, str]:
        """Read a remote XDI file and return its metadata as key-value pairs."""

        return parse_xdi_metadata(self.read_text(beamline, file))

    def read_xdi(self, beamline: str, file: str) -> XDIFile:
        """Read a remote XDI file and return parsed metadata, columns, and rows."""

        return parse_xdi(self.read_text(beamline, file))

    def filter_options(self) -> dict[str, list[str]]:
        """Return available search values in the same field order as the homepage."""

        spectra = self.spectra()
        return {
            "element_symbol": _unique(item.element_symbol for item in spectra),
            "element_edge": _unique(item.element_edge for item in spectra),
            "mono_name": [value for value in ["311", "111", "220"] if any(_normalize_mono_name(item.mono_name) == value for item in spectra)],
            "sample_temperature": _unique(item.sample_temperature for item in spectra),
            "beamline": _unique(item.beamline for item in spectra),
        }

    def _beamline_info(self, beamline: str) -> dict[str, str]:
        beamlines = self.catalog().get("beamlines", {})
        if beamline in beamlines:
            return beamlines[beamline]

        for item in beamlines.values():
            if _same_value(item["name"], beamline):
                return item

        available = ", ".join(item["name"] for item in beamlines.values()) or "none"
        raise ValueError(f"Unknown beamline '{beamline}'. Available: {available}")

    def _beamline_id(self, beamline: str) -> str:
        beamlines = self.catalog().get("beamlines", {})
        if beamline in beamlines:
            return beamline

        for beamline_id, item in beamlines.items():
            if _same_value(item["name"], beamline):
                return beamline_id

        self._beamline_info(beamline)
        return beamline

    def _load_spectra(self, beamline: str) -> list[Spectrum]:
        beamline_info = self._beamline_info(beamline)
        manifest = self.manifest(beamline)
        results: list[Spectrum] = []

        for element_symbol in sorted(manifest):
            for item in manifest[element_symbol]:
                file = item["file"]
                text = self.read_text(beamline, file)
                metadata = _parse_metadata(text)
                results.append(
                    Spectrum(
                        beamline_id=beamline,
                        beamline=beamline_info["name"],
                        file=file,
                        url=self.file_url(beamline, file),
                        facility_name=metadata["facility_name"],
                        element_symbol=_fallback(metadata["element_symbol"], element_symbol),
                        element_edge=metadata["element_edge"],
                        mono_name=metadata["mono_name"],
                        sample_temperature=metadata["sample_temperature"],
                    )
                )

        return results

    @staticmethod
    def _matches(value: str, expected: Optional[str]) -> bool:
        return _is_any(expected) or _same_value(value, expected)

    @staticmethod
    def _matches_beamline(item: Spectrum, expected: Optional[str]) -> bool:
        return _is_any(expected) or _same_value(item.beamline, expected) or _same_value(item.beamline_id, expected)

    def _get_json(self, path: str) -> dict[str, Any]:
        return json.loads(self._get_bytes(urljoin(self.base_url, path)).decode("utf-8"))

    def _get_bytes(self, url: str) -> bytes:
        try:
            with urlopen(url) as response:
                return response.read()
        except HTTPError as exc:
            raise RuntimeError(f"Request failed with HTTP {exc.code}: {url}") from exc
        except URLError as exc:
            raise RuntimeError(f"Could not reach {url}: {exc.reason}") from exc


def _parse_metadata(text: str) -> dict[str, str]:
    metadata = parse_xdi_metadata(text)
    return {
        "facility_name": metadata.get("Facility.name", "N/A"),
        "element_symbol": metadata.get("Element.symbol", "N/A"),
        "element_edge": metadata.get("Element.edge", "N/A"),
        "mono_name": metadata.get("Mono.name", "N/A"),
        "sample_temperature": metadata.get("Sample.temperature", "N/A"),
    }


def parse_xdi_metadata(text: str) -> dict[str, str]:
    """Parse XDI metadata comment lines as ``{key: value}`` pairs."""

    metadata: dict[str, str] = {}
    for line in text.splitlines():
        content = line.removeprefix("#").strip()
        if not content or content == "///":
            continue
        if line.lstrip().startswith("#") and ":" in content:
            key, value = content.split(":", 1)
            metadata[key.strip()] = value.strip()

    return metadata


def parse_xdi(text: str) -> XDIFile:
    """Parse XDI text into metadata, column descriptions, and numeric rows."""

    metadata = parse_xdi_metadata(text)
    rows = _parse_xdi_rows(text)
    return XDIFile(
        metadata=metadata,
        columns=_parse_xdi_columns(metadata, rows),
        rows=rows,
    )


def parse_xdi_points(text: str) -> list[XDIPoint]:
    """Parse the first two numeric XDI data columns as ``(energy, mutrans)``."""

    return parse_xdi(text).points


def _parse_xdi_rows(text: str) -> list[tuple[float, ...]]:
    """Parse all numeric columns from XDI data rows."""

    rows: list[tuple[float, ...]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        columns = line.split()
        if len(columns) < 2:
            continue

        try:
            rows.append(tuple(float(column) for column in columns))
        except ValueError:
            pass

    return rows


def _parse_xdi_columns(metadata: dict[str, str], rows: list[tuple[float, ...]]) -> list[XDIColumn]:
    columns: list[XDIColumn] = []

    for key, label in metadata.items():
        if not key.startswith("Column."):
            continue

        index_text = key.removeprefix("Column.")
        if not index_text.isdigit():
            continue

        index = int(index_text)
        columns.append(XDIColumn(index=index, name=_column_name(label)))

    columns.sort(key=lambda column: column.index)
    if columns:
        return columns

    width = max((len(row) for row in rows), default=0)
    return [
        XDIColumn(index=index, name=f"column_{index}")
        for index in range(1, width + 1)
    ]


def _column_name(label: str) -> str:
    return label.split()[0] if label.split() else ""


def _read_xdi_field(text: str, field_name: str) -> str:
    field_key = field_name.lower()
    for line in text.splitlines():
        content = line.removeprefix("#").strip()
        if content.lower().startswith(f"{field_key}:"):
            return content.split(":", 1)[1].strip()
    return "N/A"


def _normalize_mono_name(value: str) -> str:
    for reflection in ("311", "111", "220"):
        if reflection in value:
            return reflection
    return "N/A"


def _is_any(value: Optional[str]) -> bool:
    return value is None or value.strip().lower() in {"", "any"}


def _same_value(left: str, right: Optional[str]) -> bool:
    return right is not None and left.strip().casefold() == right.strip().casefold()


def _unique(values: Any) -> list[str]:
    def sort_key(value: str) -> tuple[int, str]:
        return (1, value) if value == "N/A" else (0, value)

    return sorted({value for value in values if value}, key=sort_key)


def _fallback(value: str, fallback: str) -> str:
    return fallback if value in {"", "N/A"} else value
