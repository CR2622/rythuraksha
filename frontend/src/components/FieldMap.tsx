/**
 * Developer 1 Module: Interactive Agricultural Field Map (Leaflet + OpenStreetMap)
 * Supports selecting verified Telangana field boundaries (FIELD001, FIELD002, FIELD003).
 * Works both controlled via props and standalone if rendered directly by a teammate.
 */

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import { MapPin, Satellite, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FieldItem, fetchFields } from '../services/api';

interface FieldMapProps {
  fields?: FieldItem[];
  selectedFieldId?: string;
  onSelectField?: (field: FieldItem) => void;
  height?: string;
}

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 15, { duration: 0.7 });
    }
  }, [center, map]);
  return null;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  fields: propFields,
  selectedFieldId = 'FIELD001',
  onSelectField,
  height = '360px',
}) => {
  const [internalFields, setInternalFields] = useState<FieldItem[]>([]);
  const [activeId, setActiveId] = useState<string>(selectedFieldId);

  useEffect(() => {
    setActiveId(selectedFieldId);
  }, [selectedFieldId]);

  useEffect(() => {
    if (!propFields || propFields.length === 0) {
      fetchFields()
        .then((res) => setInternalFields(res.fields || []))
        .catch(() => {});
    }
  }, [propFields]);

  const fieldList = propFields && propFields.length > 0 ? propFields : internalFields;
  const activeField =
    fieldList.find((f) => f.field_id === activeId) ||
    fieldList[0] || {
      field_id: 'FIELD001',
      farmer_id: 'FARMER-TS-001',
      farmer_name: 'B. Ramesh Goud',
      village: 'Duggondi',
      mandal: 'Narsampet',
      district: 'Warangal, Telangana',
      survey_no: 'SY-114/A',
      pattadar_passbook: 'PPB-TS-8841209',
      crop: 'Paddy',
      area_acres: 4.2,
      lat: 17.9689,
      lon: 79.5941,
      default_event_date: '2024-09-01',
      satellite_available: true,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [79.5922, 17.9704],
            [79.596, 17.9704],
            [79.596, 17.9674],
            [79.5922, 17.9674],
            [79.5922, 17.9704],
          ],
        ],
      },
    };

  const centerCoords: [number, number] = [
    activeField.lat || 17.9689,
    activeField.lon || 79.5941,
  ];

  const handleSelect = (f: FieldItem) => {
    setActiveId(f.field_id);
    if (onSelectField) {
      onSelectField(f);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Field Selector Bar */}
      <div className="px-4 py-3 bg-forest-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-forest-800" />
          <span className="font-semibold text-slate-800 text-sm">
            Select Verified Telangana Agricultural Field Boundary
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {fieldList.map((f) => {
            const isSelected = f.field_id === activeField.field_id;
            return (
              <button
                key={f.field_id}
                type="button"
                onClick={() => handleSelect(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-forest-800 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{f.field_id}</span>
                <span className="opacity-80">({f.crop} • {f.district.split(',')[0]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div style={{ height }} className="w-full relative">
        <MapContainer
          center={centerCoords}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFlyTo center={centerCoords} />

          {fieldList.map((field) => {
            const ring = field.geometry?.coordinates?.[0] || [];
            const latLngRing: [number, number][] = ring.map((pt) => [pt[1], pt[0]]);
            const isSelected = field.field_id === activeField.field_id;

            if (latLngRing.length === 0) return null;

            return (
              <Polygon
                key={field.field_id}
                positions={latLngRing}
                pathOptions={{
                  color: isSelected ? '#14532d' : '#475569',
                  weight: isSelected ? 3 : 2,
                  fillColor: field.satellite_available ? '#16a34a' : '#f59e0b',
                  fillOpacity: isSelected ? 0.45 : 0.25,
                }}
                eventHandlers={{
                  click: () => handleSelect(field),
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-forest-900">
                      {field.field_id} — {field.crop} ({field.area_acres} Acres)
                    </div>
                    <div>Farmer: {field.farmer_name}</div>
                    <div>Survey No: {field.survey_no}</div>
                    <div>
                      Location: {field.village}, {field.district}
                    </div>
                    <div className="font-mono text-[11px] text-slate-600">
                      Lat: {field.lat.toFixed(4)}, Lon: {field.lon.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>

      {/* Selected Field Metadata Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            <strong>Selected Field:</strong> {activeField.field_id} ({activeField.survey_no})
          </span>
          <span>
            <strong>Farmer:</strong> {activeField.farmer_name}
          </span>
          <span>
            <strong>Crop:</strong> {activeField.crop} ({activeField.area_acres} Acres)
          </span>
          <span className="font-mono">
            <strong>GPS:</strong> {activeField.lat.toFixed(4)}°N, {activeField.lon.toFixed(4)}°E
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Satellite className="w-4 h-4 text-forest-700" />
          {activeField.satellite_available ? (
            <span className="inline-flex items-center gap-1 text-forest-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
              Verified Sentinel-2 Evidence Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Cloud-Obscured (Weather-Only Analysis Mode)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldMap;
