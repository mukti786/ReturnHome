import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, Globe, Layers, MapPin, Navigation, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import LogoMark from '../components/branding/LogoMark';
import { apiService } from '../services/api';
import { MissingPersonCase } from '../types';

const validCoordinates = (record: MissingPersonCase) => Number.isFinite(record.latitude) && Number.isFinite(record.longitude) && Math.abs(record.latitude!) <= 90 && Math.abs(record.longitude!) <= 180;

export const MapViewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [selectedId, setSelectedId] = useState(searchParams.get('caseId') || '');
  const [mapMode, setMapMode] = useState<'satellite' | 'street' | 'hybrid'>('satellite');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const overlayRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    let active = true;
    apiService.getCases({ limit: '200' }).then((response) => {
      if (active) setCases(response.cases || []);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Case records could not be loaded.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const locatedCases = useMemo(() => cases.filter(validCoordinates), [cases]);
  const selectedCase = cases.find((item) => item.caseId === selectedId) || null;

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    mapRef.current = L.map(mapElement.current, { center: [20, 0], zoom: 2, zoomControl: false });
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    if (overlayRef.current) map.removeLayer(overlayRef.current);
    const street = mapMode === 'street';
    const tile = L.tileLayer(street ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18, attribution: street ? '&copy; OpenStreetMap contributors' : 'Tiles &copy; Esri',
    }).addTo(map);
    tile.once('tileerror', () => setTilesUnavailable(true));
    tileRef.current = tile;
    if (mapMode === 'hybrid') {
      const overlay = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18, attribution: 'Labels &copy; Esri',
      }).addTo(map);
      overlay.once('tileerror', () => setTilesUnavailable(true));
      overlayRef.current = overlay;
    }
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];
    locatedCases.forEach((record) => {
      const marker = L.circleMarker([record.latitude!, record.longitude!], { radius: 9, color: '#fff', weight: 2, fillColor: '#0f766e', fillOpacity: 0.95 }).addTo(map);
      const popup = document.createElement('div');
      const name = document.createElement('strong'); name.textContent = record.name; popup.append(name);
      const id = document.createElement('p'); id.textContent = record.caseId; popup.append(id);
      const status = document.createElement('p'); status.textContent = `Status: ${record.status}`; popup.append(status);
      const location = document.createElement('p'); location.textContent = `Last seen: ${record.lastSeenLocation}`; popup.append(location);
      marker.bindPopup(popup);
      marker.on('click', () => setSelectedId(record.caseId));
      markersRef.current.push(marker);
    });
    const selectedLocatedCase = locatedCases.find((record) => record.caseId === selectedId);
    if (selectedLocatedCase) map.flyTo([selectedLocatedCase.latitude!, selectedLocatedCase.longitude!], 12, { duration: 0.5 });
    else if (locatedCases.length > 1) map.fitBounds(L.latLngBounds(locatedCases.map((record) => [record.latitude!, record.longitude!])), { padding: [30, 30], maxZoom: 12 });
    else if (locatedCases.length === 1) map.setView([locatedCases[0].latitude!, locatedCases[0].longitude!], 12);
  }, [locatedCases, selectedId, mapMode]);

  const zoom = (delta: number) => mapRef.current?.setZoom(mapRef.current.getZoom() + delta);
  const reset = () => {
    const map = mapRef.current;
    if (!map) return;
    if (locatedCases.length) map.fitBounds(L.latLngBounds(locatedCases.map((record) => [record.latitude!, record.longitude!])), { padding: [30, 30], maxZoom: 12 });
    else map.setView([20, 0], 2);
  };

  return <div className="min-h-screen bg-slate-50 text-slate-900 flex"><Sidebar /><div className="flex-1 flex min-w-0 flex-col"><Navbar /><main className="flex-1 space-y-5 overflow-y-auto p-6">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><LogoMark size="md" theme="dark"/><div><h1 className="text-xl font-extrabold">Case location map</h1><p className="text-xs text-slate-600">Only coordinates saved on case records are shown. Map pins are not sightings or AI results.</p></div></div><label className="text-xs font-semibold">Case record<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="ml-2 max-w-64 rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">All cases</option>{cases.map((record) => <option key={record.caseId} value={record.caseId}>{record.caseId} — {record.name}</option>)}</select></label></header>
    <BrandDisclaimer variant="compact"/><p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">Location pins represent coordinates entered in the case record; they do not verify a sighting. Seed case records may be sample data.</p>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">Could not load case locations: {error}</p>}
    {loading && <p role="status" className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading case locations…</p>}
    {!loading && !error && locatedCases.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No case records contain valid coordinates to map.</p>}
    <section className="grid gap-5 lg:grid-cols-12"><div className="relative min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2 lg:col-span-8"><div className="absolute left-4 top-4 z-[500] flex gap-1 rounded-xl border bg-white/95 p-1 shadow"><button type="button" onClick={() => setMapMode('satellite')} aria-pressed={mapMode === 'satellite'} className={`rounded-lg p-2 text-xs ${mapMode === 'satellite' ? 'bg-teal-800 text-white' : ''}`}><Globe className="mr-1 inline h-4 w-4"/>Satellite</button><button type="button" onClick={() => setMapMode('hybrid')} aria-pressed={mapMode === 'hybrid'} className={`rounded-lg p-2 text-xs ${mapMode === 'hybrid' ? 'bg-teal-800 text-white' : ''}`}><Layers className="mr-1 inline h-4 w-4"/>Imagery</button><button type="button" onClick={() => setMapMode('street')} aria-pressed={mapMode === 'street'} className={`rounded-lg p-2 text-xs ${mapMode === 'street' ? 'bg-teal-800 text-white' : ''}`}><Compass className="mr-1 inline h-4 w-4"/>Street</button></div><div className="absolute right-4 top-4 z-[500] flex flex-col rounded-xl border bg-white shadow"><button type="button" aria-label="Zoom in" onClick={() => zoom(1)} className="p-2"><ZoomIn className="h-4 w-4"/></button><button type="button" aria-label="Zoom out" onClick={() => zoom(-1)} className="p-2"><ZoomOut className="h-4 w-4"/></button><button type="button" aria-label="Reset map view" onClick={reset} className="p-2"><RotateCcw className="h-4 w-4"/></button></div><div ref={mapElement} className="h-[460px] w-full rounded-xl" role="application" aria-label="Map of case record coordinates"/>{tilesUnavailable && <p role="status" className="absolute bottom-4 left-4 z-[500] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-700">Map imagery is unavailable. Case coordinate details remain available.</p>}</div>
    <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4"><h2 className="flex items-center gap-2 border-b pb-3 text-sm font-bold"><Navigation className="h-4 w-4 text-teal-700"/>Stored case location</h2>{selectedCase ? <><h3 className="font-bold">{selectedCase.name}</h3><p className="font-mono text-xs text-slate-500">{selectedCase.caseId}</p><p className="text-sm text-slate-700">{selectedCase.lastSeenLocation || 'No last-seen location recorded'}</p><p className="text-xs text-slate-600">Status: {selectedCase.status}</p>{validCoordinates(selectedCase) ? <p className="rounded-lg bg-slate-50 p-3 font-mono text-xs"><MapPin className="mr-1 inline h-4 w-4 text-teal-700"/>{selectedCase.latitude}, {selectedCase.longitude}</p> : <p className="text-xs text-slate-500">No valid coordinates are saved for this case.</p>}<a href={`/cases/${encodeURIComponent(selectedCase.caseId)}`} className="inline-block text-sm font-semibold text-teal-800 underline">Open case details</a></> : <p className="text-sm text-slate-600">{locatedCases.length} case record(s) with valid coordinates.</p>}{!loading && cases.length > locatedCases.length && <p className="text-xs text-slate-500">{cases.length - locatedCases.length} case record(s) have no valid coordinates and are not plotted.</p>}<p className="border-t pt-3 text-xs text-slate-500">{tilesUnavailable ? 'Map service may be offline; locations are listed from saved case records.' : 'Location details come from the case data source.'}</p></aside></section>
  </main><Footer/></div></div>;
};

export default MapViewPage;
