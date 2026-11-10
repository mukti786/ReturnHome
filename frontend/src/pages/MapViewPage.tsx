import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Compass, Globe, Layers, MapPin, Navigation, RotateCcw,
  ZoomIn, ZoomOut, Camera, Eye, Filter, ExternalLink, Calendar
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import LogoMark from '../components/branding/LogoMark';
import { apiService } from '../services/api';
import { MissingPersonCase, SightingItem, CameraFeed } from '../types';

interface MapMarkerItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'case_last_seen' | 'sighting' | 'camera';
  typeLabel: string;
  latitude: number;
  longitude: number;
  locationName: string;
  timestamp?: string;
  status?: string;
  photoUrl?: string;
  link?: string;
  caseRef?: string;
}

export const MapViewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId') || '';

  const [cases, setCases] = useState<MissingPersonCase[]>([]);
  const [sightings, setSightings] = useState<SightingItem[]>([]);
  const [cameras, setCameras] = useState<CameraFeed[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string>('');

  const [typeFilter, setTypeFilter] = useState<'all' | 'case_last_seen' | 'sighting' | 'camera'>('all');
  const [mapMode, setMapMode] = useState<'satellite' | 'street' | 'hybrid'>('street');
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
    async function loadAllLocations() {
      setLoading(true);
      try {
        const [casesRes, sightingsRes, camerasRes] = await Promise.all([
          apiService.getCases({ limit: '100' }).catch(() => ({ cases: [] })),
          apiService.getSightings({ limit: '100' }).catch(() => ({ sightings: [] })),
          apiService.getCameras().catch(() => ({ cameras: [] }))
        ]);
        if (active) {
          setCases(casesRes.cases || []);
          setSightings(sightingsRes.sightings || []);
          setCameras(camerasRes.cameras || []);
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Failed to load location intelligence.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAllLocations();
    return () => { active = false; };
  }, []);

  // Consolidate into unified map marker items
  const allMarkers: MapMarkerItem[] = useMemo(() => {
    const list: MapMarkerItem[] = [];

    // Cases
    cases.forEach((c) => {
      if (Number.isFinite(c.latitude) && Number.isFinite(c.longitude)) {
        list.push({
          id: `case-${c.caseId}`,
          title: c.name,
          subtitle: `Missing Person Case (${c.caseId})`,
          type: 'case_last_seen',
          typeLabel: 'Last Known Location',
          latitude: c.latitude!,
          longitude: c.longitude!,
          locationName: c.lastSeenLocation,
          timestamp: `${c.lastSeenDate} ${c.lastSeenTime || ''}`,
          status: c.status,
          photoUrl: c.photos?.[0],
          link: `/cases/${c.caseId}`,
          caseRef: c.caseId
        });
      }
    });

    // Sightings
    sightings.forEach((s) => {
      if (Number.isFinite(s.latitude) && Number.isFinite(s.longitude)) {
        list.push({
          id: `sight-${s.sightingId}`,
          title: `Sighting: ${s.caseRef}`,
          subtitle: `Reported by ${s.reporterName}`,
          type: 'sighting',
          typeLabel: s.locationSource === 'citizen_gps' ? 'Citizen GPS Sighting' : 'Reported Sighting',
          latitude: s.latitude!,
          longitude: s.longitude!,
          locationName: s.location,
          timestamp: new Date(s.dateTimeSeen).toLocaleString(),
          status: s.status,
          photoUrl: s.photoUrl,
          link: `/cases/${s.caseRef}`,
          caseRef: s.caseRef
        });
      }
    });

    // Cameras
    cameras.forEach((cam) => {
      if (Number.isFinite(cam.latitude) && Number.isFinite(cam.longitude)) {
        list.push({
          id: `cam-${cam.cameraId}`,
          title: cam.name,
          subtitle: `CCTV Ingestion Node (${cam.cameraId})`,
          type: 'camera',
          typeLabel: 'Live Surveillance Camera',
          latitude: cam.latitude,
          longitude: cam.longitude,
          locationName: cam.location,
          status: cam.status,
          link: '/live-camera'
        });
      }
    });

    return list;
  }, [cases, sightings, cameras]);

  const filteredMarkers = useMemo(() => {
    if (typeFilter === 'all') return allMarkers;
    return allMarkers.filter((m) => m.type === typeFilter);
  }, [allMarkers, typeFilter]);

  const selectedMarker = allMarkers.find((m) => m.id === selectedMarkerId) || allMarkers[0] || null;

  // Initialize Map
  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    mapRef.current = L.map(mapElement.current, { center: [28.6139, 77.2090], zoom: 5, zoomControl: false });
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // Update Layers & Pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileRef.current) map.removeLayer(tileRef.current);
    if (overlayRef.current) map.removeLayer(overlayRef.current);

    const street = mapMode === 'street';
    const tile = L.tileLayer(
      street
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: street ? '&copy; OpenStreetMap contributors' : 'Tiles &copy; Esri'
      }
    ).addTo(map);

    tile.once('tileerror', () => setTilesUnavailable(true));
    tileRef.current = tile;

    if (mapMode === 'hybrid') {
      const overlay = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, attribution: 'Labels &copy; Esri' }
      ).addTo(map);
      overlay.once('tileerror', () => setTilesUnavailable(true));
      overlayRef.current = overlay;
    }

    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    filteredMarkers.forEach((item) => {
      const color =
        item.type === 'case_last_seen' ? '#0f766e' :
        item.type === 'sighting' ? '#d97706' :
        '#2563eb';

      const marker = L.circleMarker([item.latitude, item.longitude], {
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.95
      }).addTo(map);

      const popup = document.createElement('div');
      popup.className = 'p-1 text-xs';
      const title = document.createElement('strong');
      title.className = 'block font-bold text-slate-900';
      title.textContent = item.title;
      popup.appendChild(title);

      const type = document.createElement('span');
      type.className = 'inline-block text-[10px] uppercase font-bold text-slate-500 mt-0.5';
      type.textContent = item.typeLabel;
      popup.appendChild(type);

      const loc = document.createElement('p');
      loc.className = 'text-[11px] text-slate-600 mt-1';
      loc.textContent = item.locationName;
      popup.appendChild(loc);

      marker.bindPopup(popup);
      marker.on('click', () => setSelectedMarkerId(item.id));
      markersRef.current.push(marker);
    });

    if (caseIdParam) {
      const targetCaseMarker = allMarkers.find((m) => m.caseRef === caseIdParam);
      if (targetCaseMarker) {
        setSelectedMarkerId(targetCaseMarker.id);
        map.flyTo([targetCaseMarker.latitude, targetCaseMarker.longitude], 13, { duration: 0.5 });
        return;
      }
    }

    if (filteredMarkers.length > 1) {
      map.fitBounds(L.latLngBounds(filteredMarkers.map((m) => [m.latitude, m.longitude])), { padding: [40, 40], maxZoom: 13 });
    } else if (filteredMarkers.length === 1) {
      map.setView([filteredMarkers[0].latitude, filteredMarkers[0].longitude], 12);
    }
  }, [filteredMarkers, mapMode, caseIdParam]);

  const zoom = (delta: number) => mapRef.current?.setZoom(mapRef.current.getZoom() + delta);
  const reset = () => {
    const map = mapRef.current;
    if (!map) return;
    if (filteredMarkers.length) {
      map.fitBounds(L.latLngBounds(filteredMarkers.map((m) => [m.latitude, m.longitude])), { padding: [40, 40], maxZoom: 12 });
    } else {
      map.setView([28.6139, 77.2090], 5);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-[#356a5a]">
                <MapPin size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Geospatial Location Intelligence</h1>
                <p className="text-xs text-slate-500">
                  Multi-source provenance map: registered case locations, citizen GPS sightings, and fixed surveillance nodes.
                </p>
              </div>
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter size={13} /> Provenance:
              </span>
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#356a5a] focus:outline-none"
              >
                <option value="all">All Sources ({allMarkers.length})</option>
                <option value="case_last_seen">Case Last Seen</option>
                <option value="sighting">Citizen GPS Sightings</option>
                <option value="camera">Surveillance Cameras</option>
              </select>
            </div>
          </header>

          <BrandDisclaimer variant="compact" />

          {/* Map & Detail Layout */}
          <section className="grid gap-6 lg:grid-cols-12">
            {/* Interactive Map */}
            <div className="relative min-h-[540px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 lg:col-span-8 shadow-sm">
              {/* Map controls top left */}
              <div className="absolute left-4 top-4 z-[500] flex gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur">
                <button
                  type="button"
                  onClick={() => setMapMode('street')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${mapMode === 'street' ? 'bg-[#1d5147] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Compass className="mr-1 inline h-3.5 w-3.5" /> Street
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('satellite')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${mapMode === 'satellite' ? 'bg-[#1d5147] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Globe className="mr-1 inline h-3.5 w-3.5" /> Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('hybrid')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${mapMode === 'hybrid' ? 'bg-[#1d5147] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Layers className="mr-1 inline h-3.5 w-3.5" /> Hybrid
                </button>
              </div>

              {/* Zoom controls top right */}
              <div className="absolute right-4 top-4 z-[500] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-md">
                <button type="button" aria-label="Zoom in" onClick={() => zoom(1)} className="p-2.5 text-slate-600 hover:bg-slate-50 border-b border-slate-100">
                  <ZoomIn size={16} />
                </button>
                <button type="button" aria-label="Zoom out" onClick={() => zoom(-1)} className="p-2.5 text-slate-600 hover:bg-slate-50 border-b border-slate-100">
                  <ZoomOut size={16} />
                </button>
                <button type="button" aria-label="Reset map view" onClick={reset} className="p-2.5 text-slate-600 hover:bg-slate-50">
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Map Canvas */}
              <div ref={mapElement} className="h-[540px] w-full" role="application" aria-label="Interactive map" />

              {/* Legend bottom left */}
              <div className="absolute bottom-4 left-4 z-[500] flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-md backdrop-blur text-[11px] font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 px-2 py-0.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" /> Case Last Known
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" /> Citizen Sighting
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" /> Surveillance Camera
                </span>
              </div>
            </div>

            {/* Selected Location Drawer */}
            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Marker Details</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {filteredMarkers.length} Plotted Pins
                  </span>
                </div>

                {selectedMarker ? (
                  <div className="mt-4 space-y-4">
                    {selectedMarker.photoUrl && (
                      <div className="h-44 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <img
                          src={selectedMarker.photoUrl}
                          alt={selectedMarker.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div>
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        selectedMarker.type === 'case_last_seen' ? 'bg-teal-100 text-teal-800' :
                        selectedMarker.type === 'sighting' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedMarker.typeLabel}
                      </span>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">{selectedMarker.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">{selectedMarker.subtitle}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Reported Location Address</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedMarker.locationName}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">Geographic Coordinates</span>
                        <p className="font-mono text-slate-700 mt-0.5">
                          {selectedMarker.latitude.toFixed(5)}, {selectedMarker.longitude.toFixed(5)}
                        </p>
                      </div>

                      {selectedMarker.timestamp && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">Timestamp</span>
                          <p className="text-slate-600 mt-0.5">{selectedMarker.timestamp}</p>
                        </div>
                      )}

                      {selectedMarker.status && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">Current Status</span>
                          <p className="font-bold text-slate-900 mt-0.5">{selectedMarker.status}</p>
                        </div>
                      )}
                    </div>

                    {selectedMarker.link && (
                      <Link
                        to={selectedMarker.link}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#356a5a] py-2.5 text-xs font-semibold text-white hover:bg-[#2b5548]"
                      >
                        Inspect Dossier Details <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Click any marker on the map to inspect its location intelligence.
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                Location intelligence strictly reflects registered GPS points, configured camera positions, and verified citizen submissions.
              </div>
            </aside>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MapViewPage;
