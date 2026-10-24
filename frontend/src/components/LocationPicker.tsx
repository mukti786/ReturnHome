import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

type Props = { latitude: string; longitude: string; onChange: (latitude: string, longitude: string) => void };

const LocationPicker: React.FC<Props> = ({ latitude, longitude, onChange }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = L.map(hostRef.current, { center: [20, 0], zoom: 2, scrollWheelZoom: false });
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    tiles.on('tileerror', () => setTilesUnavailable(true));
    map.on('click', (event: L.LeafletMouseEvent) => {
      const lat = event.latlng.lat.toFixed(6);
      const lng = event.latlng.lng.toFixed(6);
      markerRef.current?.remove();
      markerRef.current = L.circleMarker(event.latlng, { radius: 8, color: '#5eead4', fillColor: '#0f766e', fillOpacity: 1 }).addTo(map);
      onChangeRef.current(lat, lng);
    });
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const lat = Number(latitude); const lng = Number(longitude);
    if (!map || !latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const point: L.LatLngExpression = [lat, lng];
    if (!markerRef.current) markerRef.current = L.circleMarker(point, { radius: 8, color: '#5eead4', fillColor: '#0f766e', fillOpacity: 1 }).addTo(map);
    else markerRef.current.setLatLng(point);
    map.setView(point, Math.max(map.getZoom(), 13));
  }, [latitude, longitude]);

  return <div>
    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200"><MapPin size={16} className="text-teal-300" /> Select a last-seen point (optional)</div>
    <div ref={hostRef} className="h-56 overflow-hidden rounded-xl border border-slate-700 bg-slate-900" aria-label="Map to select last-seen location" />
    <p className="mt-2 text-xs leading-5 text-slate-400">Click the map to set coordinates. The pin is only as accurate as the point selected. {tilesUnavailable && 'Map tiles are unavailable; enter the place and coordinates manually if known.'}</p>
  </div>;
};

export default LocationPicker;
