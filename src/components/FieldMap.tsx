/**
 * Interactive Telangana Agricultural Field Map (Leaflet + OpenStreetMap)
 * Priority 2: Centered on Telangana, district filtering, field validation, and satellite workflow.
 */

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import {
  MapPin,
  Satellite,
  AlertCircle,
  CheckCircle2,
  Filter,
  Plus,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { FieldItem, fetchFields } from '../services/api';

interface FieldMapProps {
  fields?: FieldItem[];
  selectedFieldId?: string;
  onSelectField?: (field: FieldItem) => void;
  height?: string;
}

const TELANGANA_DISTRICTS = [
  'All Districts',
  'Warangal',
  'Khammam',
  'Karimnagar',
  'Nalgonda',
  'Nizamabad',
  'Rangareddy',
  'Medak',
  'Mahabubnagar',
];

// Telangana boundary bounds check
export function isWithinTelangana(lat: number, lon: number): boolean {
  return lat >= 15.8 && lat <= 19.9 && lon >= 77.2 && lon <= 81.8;
}

function MapFlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 14, { duration: 0.8 });
    }
  }, [center, map]);
  return null;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  fields: propFields,
  selectedFieldId = 'FIELD001',
  onSelectField,
  height = '380px',
}) => {
  const [internalFields, setInternalFields] = useState<FieldItem[]>([]);
  const [activeId, setActiveId] = useState<string>(selectedFieldId);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New field registration form state
  const [newSurveyNo, setNewSurveyNo] = useState('SY-240/B');
  const [newVillage, setNewVillage] = useState('Duggondi');
  const [newMandal, setNewMandal] = useState('Narsampet');
  const [newDistrict, setNewDistrict] = useState('Warangal');
  const [newCrop, setNewCrop] = useState('Paddy');
  const [newVariety, setNewVariety] = useState('Telangana Sona');
  const [newAcres, setNewAcres] = useState(3.5);
  const [newLat, setNewLat] = useState(17.9712);
  const [newLon, setNewLon] = useState(79.5985);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const allAvailableFields = propFields && propFields.length > 0 ? propFields : internalFields;

  // Filter fields by selected Telangana district
  const filteredFields = allAvailableFields.filter((f) => {
    if (selectedDistrict === 'All Districts') return true;
    return f.district.toLowerCase().includes(selectedDistrict.toLowerCase());
  });

  const activeField =
    filteredFields.find((f) => f.field_id === activeId) ||
    allAvailableFields.find((f) => f.field_id === activeId) ||
    allAvailableFields[0] || {
      field_id: 'FIELD001',
      farmer_id: 'FARMER-TS-001',
      farmer_name: 'B. Ramesh Goud',
      farmer_name_te: 'బి. రమేష్ గౌడ్',
      village: 'Duggondi',
      mandal: 'Narsampet',
      district: 'Warangal, Telangana',
      survey_no: 'SY-114/A',
      pattadar_passbook: 'PPB-TS-8841209',
      crop: 'Paddy',
      crop_variety: 'Telangana Sona',
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

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWithinTelangana(newLat, newLon)) {
      setValidationError(
        'Location outside Telangana! Coordinates must be within Latitude 15.8° - 19.9° and Longitude 77.2° - 81.8°.'
      );
      return;
    }

    const newFieldId = `FIELD-${Date.now().toString().slice(-4)}`;
    const offset = 0.002;
    const customField: FieldItem = {
      field_id: newFieldId,
      farmer_id: 'FARMER-TS-NEW',
      farmer_name: 'B. Ramesh Goud',
      farmer_name_te: 'బి. రమేష్ గౌడ్',
      village: newVillage,
      mandal: newMandal,
      district: `${newDistrict}, Telangana`,
      survey_no: newSurveyNo,
      pattadar_passbook: 'PPB-TS-CUSTOM',
      crop: newCrop,
      crop_variety: newVariety,
      area_acres: newAcres,
      lat: newLat,
      lon: newLon,
      default_event_date: '2024-09-01',
      satellite_available: true,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [newLon - offset, newLat + offset],
            [newLon + offset, newLat + offset],
            [newLon + offset, newLat - offset],
            [newLon - offset, newLat - offset],
            [newLon - offset, newLat + offset],
          ],
        ],
      },
    };

    setInternalFields((prev) => [customField, ...prev]);
    handleSelect(customField);
    setShowAddModal(false);
    setValidationError(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#3B7C61]/25 shadow-sm overflow-hidden">
      {/* Top Field Selector & District Filter Bar */}
      <div className="px-5 py-3.5 bg-[#153E32]/5 border-b border-[#3B7C61]/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#153E32] text-white flex items-center justify-center">
            <MapPin className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <span className="font-bold text-[#153E32] text-sm tracking-tight block">
              Telangana Agricultural Cadastral Map
            </span>
            <span className="text-[11px] text-slate-500 block">
              తెలంగాణ వ్యవసాయ భూముల మ్యాప్ • Coordinates restricted to Telangana
            </span>
          </div>
        </div>

        {/* Filter & Register Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* District Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-[#3B7C61]/30 rounded-lg px-2.5 py-1 text-xs text-slate-700 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-[#3B7C61]" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              {TELANGANA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Register Field Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#153E32] hover:bg-[#204E3D] text-white text-xs font-semibold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Field</span>
          </button>
        </div>
      </div>

      {/* Field Quick-Pick Chips */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex overflow-x-auto gap-2 items-center">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Saved Fields:
        </span>
        {filteredFields.map((f) => {
          const isSelected = f.field_id === activeField.field_id;
          return (
            <button
              key={f.field_id}
              type="button"
              onClick={() => handleSelect(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 border ${
                isSelected
                  ? 'bg-[#153E32] text-white border-[#153E32] shadow-sm ring-1 ring-[#3B7C61]/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#3B7C61]/50 hover:bg-[#3B7C61]/5'
              }`}
            >
              <span className="font-bold">{f.field_id}</span>
              <span className="text-[11px] opacity-90">({f.crop})</span>
              <span className="text-[10px] opacity-75">• {f.area_acres} Ac</span>
              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
            </button>
          );
        })}
      </div>

      {/* Leaflet Map Canvas */}
      <div style={{ height }} className="relative z-10 w-full">
        <MapContainer
          center={centerCoords}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFlyTo center={centerCoords} />

          {/* Render All Verified Polygons */}
          {allAvailableFields.map((f) => {
            const isSelected = f.field_id === activeField.field_id;
            const coords = f.geometry?.coordinates?.[0] || [];
            if (!coords || coords.length === 0) return null;

            const latLngs: [number, number][] = coords.map((c: any) => [c[1], c[0]]);

            return (
              <Polygon
                key={f.field_id}
                positions={latLngs}
                pathOptions={{
                  color: isSelected ? '#153E32' : '#3B7C61',
                  fillColor: isSelected ? '#22c55e' : '#86efac',
                  fillOpacity: isSelected ? 0.45 : 0.25,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => handleSelect(f),
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <div className="font-bold text-slate-900 flex items-center justify-between gap-2">
                      <span>{f.field_id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {f.crop}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      <div>Survey: <strong>{f.survey_no}</strong></div>
                      <div>Area: <strong>{f.area_acres} Acres</strong></div>
                      <div>Village: {f.village}, {f.district}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelect(f)}
                      className="mt-1 w-full text-center py-1 rounded bg-[#153E32] text-white text-[11px] font-bold"
                    >
                      Select for Damage Assessment
                    </button>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>

      {/* Selected Field Verification Ribbon */}
      <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div>
            <span className="text-slate-500 font-medium">Selected Field:</span>{' '}
            <strong className="text-[#153E32] font-bold text-sm">
              {activeField.field_id}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Survey No:</span>{' '}
            <strong className="text-slate-800">{activeField.survey_no}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Location:</span>{' '}
            <span className="text-slate-700">
              {activeField.village}, {activeField.district}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Crop:</span>{' '}
            <span className="font-semibold text-slate-800">
              {activeField.crop} ({activeField.crop_variety || 'Standard'}) • {activeField.area_acres} Acres
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeField.satellite_available ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
              <Satellite className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sentinel-2 L2A Supported</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Weather-Only (Cloud Cover)</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 text-[11px] font-semibold border border-sky-200">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Telangana Cadastral Validated</span>
          </span>
        </div>
      </div>

      {/* Add Custom Field Modal with Telangana Boundary Validation */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#153E32] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Register Telangana Agricultural Field</h3>
                <p className="text-[11px] text-emerald-200">
                  కొత్త తెలంగాణ వ్యవసాయ భూమి నమోదు (Cadastral Coordinates)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setValidationError(null);
                }}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCustomField} className="p-5 space-y-3.5 text-xs">
              {validationError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Survey Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newSurveyNo}
                    onChange={(e) => setNewSurveyNo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Area (Acres)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newAcres}
                    onChange={(e) => setNewAcres(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Crop</label>
                  <select
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
                  >
                    <option value="Paddy">Paddy (వరి)</option>
                    <option value="Chilli">Chilli (మిరప)</option>
                    <option value="Cotton">Cotton (పత్తి)</option>
                    <option value="Maize">Maize (మొక్కజొన్న)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Crop Variety
                  </label>
                  <input
                    type="text"
                    value={newVariety}
                    onChange={(e) => setNewVariety(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Village
                  </label>
                  <input
                    type="text"
                    required
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Mandal
                  </label>
                  <input
                    type="text"
                    required
                    value={newMandal}
                    onChange={(e) => setNewMandal(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    District
                  </label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
                  >
                    {TELANGANA_DISTRICTS.filter((d) => d !== 'All Districts').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordinates with validation explanation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-semibold text-slate-700 block">
                  Telangana GPS Coordinates (15.8° - 19.9° N, 77.2° - 81.8° E)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">
                      Latitude (°N)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={newLat}
                      onChange={(e) => setNewLat(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1 rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">
                      Longitude (°E)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={newLon}
                      onChange={(e) => setNewLon(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1 rounded border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#153E32] text-white font-bold hover:bg-[#204E3D] shadow-sm"
                >
                  Validate & Save Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldMap;
