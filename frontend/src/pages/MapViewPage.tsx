import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Layers, Globe, Compass, Crosshair, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import BrandDisclaimer from '../components/branding/BrandDisclaimer';
import LogoMark from '../components/branding/LogoMark';

export const MapViewPage: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState('MP-2026-0001');
  const [mapMode, setMapMode] = useState<'satellite' | 'street' | 'hybrid'>('satellite');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Exact Delhi Sighting Checkpoint Coordinates
  const journeyPoints = [
    { 
      id: 1, 
      name: 'Last Seen Location', 
      type: 'LAST_SEEN', 
      camera: 'N/A', 
      time: 'Sep 5, 14:30', 
      lat: 28.6431, 
      lng: 77.2197, 
      latStr: '28.6431° N',
      lngStr: '77.2197° E',
      location: 'Platform 4 Concourse, New Delhi Railway Station' 
    },
    { 
      id: 2, 
      name: 'CCTV Checkpoint 1', 
      type: 'CAMERA', 
      camera: 'CAM-01', 
      time: 'Sep 7, 14:32', 
      lat: 28.6445, 
      lng: 77.2210, 
      latStr: '28.6445° N',
      lngStr: '77.2210° E',
      location: 'Railway Station Gate 3 Feed' 
    },
    { 
      id: 3, 
      name: 'CCTV Checkpoint 2', 
      type: 'CAMERA', 
      camera: 'CAM-04', 
      time: 'Sep 7, 16:05', 
      lat: 28.6329, 
      lng: 77.2194, 
      latStr: '28.6329° N',
      lngStr: '77.2194° E',
      location: 'Rajiv Chowk Metro Exit Gate 2' 
    },
    { 
      id: 4, 
      name: 'Confirmed Sighting', 
      type: 'MATCH', 
      camera: 'CAM-02', 
      time: 'Sep 7, 17:20', 
      lat: 28.6675, 
      lng: 77.2291, 
      latStr: '28.6675° N',
      lngStr: '77.2291° E',
      location: 'Kashmere Gate ISBT Bus Concourse' 
    }
  ];

  const [activePoint, setActivePoint] = useState(journeyPoints[0]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.6480, 77.2230],
        zoom: 14,
        zoomControl: false
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove existing tile layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Set Map Layer Source based on mode
    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping';

    if (mapMode === 'street') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    } else if (mapMode === 'hybrid') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    const newTileLayer = L.tileLayer(tileUrl, {
      maxZoom: 18,
      attribution
    }).addTo(map);

    tileLayerRef.current = newTileLayer;

    // Clear existing markers & polyline
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
    }

    // Add Checkpoint Pins
    const latLngs: L.LatLngExpression[] = [];

    journeyPoints.forEach((pt) => {
      latLngs.push([pt.lat, pt.lng]);

      const pinColor = pt.type === 'LAST_SEEN' ? '#EF4444' : pt.type === 'MATCH' ? '#F59E0B' : '#0284C7';
      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="
            background-color: ${pinColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-weight: bold;
            font-size: 12px;
          ">
            ${pt.id}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon }).addTo(map);
      
      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px; color: #0F172A;">
          <strong style="font-size: 13px; color: #0369A1;">${pt.name}</strong>
          <p style="font-size: 11px; margin: 2px 0 0 0; color: #475569;">${pt.location}</p>
          <span style="font-size: 10px; color: #0284C7; font-weight: bold;">${pt.time}</span>
        </div>
      `);

      marker.on('click', () => {
        setActivePoint(pt);
      });

      markersRef.current.push(marker);
    });

    // Draw Trajectory Vector Line
    const polyline = L.polyline(latLngs, {
      color: mapMode === 'satellite' ? '#38BDF8' : '#0284C7',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.9
    }).addTo(map);

    polylineRef.current = polyline;

  }, [mapMode]);

  // Pan to selected checkpoint smoothly
  const handleSelectPoint = (pt: typeof journeyPoints[0]) => {
    setActivePoint(pt);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([pt.lat, pt.lng], 16, {
        duration: 1.2
      });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([28.6480, 77.2230], 14);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <LogoMark size="md" theme="light" />
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  ReturnHome Real Satellite Geolocation & Journey Map
                </h1>
                <p className="text-xs text-slate-600">
                  Interactive Esri World Imagery Satellite Map plotting real high-resolution camera sighting coordinates.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-bold">Target Case:</span>
              <select
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-indigo-700 font-extrabold focus:border-cyan-500 focus:bg-white"
              >
                <option value="MP-2026-0001">MP-2026-0001 — Aarav Sharma</option>
                <option value="MP-2026-0002">MP-2026-0002 — Priya Verma</option>
              </select>
            </div>
          </div>

          <BrandDisclaimer variant="compact" />

          {/* Main Map Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Real Interactive Leaflet Satellite Canvas */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm relative min-h-[520px] flex flex-col justify-between overflow-hidden">
              {/* Map Layer Mode Switcher Header */}
              <div className="flex flex-wrap items-center justify-between z-20 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm">
                  <button
                    onClick={() => setMapMode('satellite')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-1.5 ${
                      mapMode === 'satellite'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" /> Esri Satellite View
                  </button>
                  <button
                    onClick={() => setMapMode('hybrid')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-1.5 ${
                      mapMode === 'hybrid'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Hybrid Overlay
                  </button>
                  <button
                    onClick={() => setMapMode('street')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-all flex items-center gap-1.5 ${
                      mapMode === 'street'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" /> Street Map
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white font-mono text-[10px] px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 shadow-sm">
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> GPS: {activePoint.latStr}, {activePoint.lngStr}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-xl font-mono text-[10px] font-extrabold">
                    REAL SATELLITE TILES
                  </span>
                </div>
              </div>

              {/* REAL LEAFLET MAP CONTAINER */}
              <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-10">
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Satellite Zoom Controls */}
                <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-lg">
                  <button
                    onClick={handleZoomIn}
                    className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Zoom In Satellite (Street Level)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Zoom Out Satellite"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetView}
                    className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                    title="Reset Map View"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Satellite Telemetry Legend */}
              <div className="z-20 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-700 bg-slate-50 border border-slate-200 p-3 rounded-2xl font-bold shadow-sm mt-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 border border-white" /> #1 Last Known Location</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-600 border border-white" /> CCTV Checkpoints</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 border border-white" /> Confirmed Candidate Match</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-700 font-extrabold">
                  HIGH-RES ESRI SATELLITE IMAGERY • DELHI NCR REGION
                </span>
              </div>
            </div>

            {/* Checkpoint Detail Sidebar Card */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-600" /> Selected Sighting Details
              </h3>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 font-medium text-xs shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-extrabold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                    Checkpoint #{activePoint.id}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">{activePoint.time}</span>
                </div>

                <h4 className="font-black text-slate-900 text-base">{activePoint.name}</h4>
                <p className="text-xs text-slate-700">{activePoint.location}</p>

                {/* Satellite GPS Box */}
                <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 space-y-1 font-mono text-[11px] text-cyan-900 shadow-sm">
                  <div className="flex items-center justify-between font-bold">
                    <span>Lat: {activePoint.latStr}</span>
                    <span>Lng: {activePoint.lngStr}</span>
                  </div>
                  <div className="text-[10px] text-cyan-800 font-bold">Verified Satellite Geolocation</div>
                </div>

                {activePoint.camera !== 'N/A' && (
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-500 block">Associated Camera Feed</span>
                    <strong className="text-indigo-700 font-mono font-bold">{activePoint.camera}</strong>
                  </div>
                )}
              </div>

              {/* Probable Movement Sequence */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Click Sighting to Pan & Zoom Satellite:</span>
                <div className="space-y-2">
                  {journeyPoints.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPoint(p)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between font-medium ${
                        activePoint.id === p.id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-mono text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="truncate max-w-[170px]">{p.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{p.time.split(',')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MapViewPage;
