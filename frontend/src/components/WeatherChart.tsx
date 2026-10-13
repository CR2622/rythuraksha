/**
 * Developer 1 & 3 Module: Weather & NDVI Evidence Charts (Recharts)
 * Displays real Open-Meteo daily rainfall/temperature observations and Sentinel-2 NDVI comparison.
 * Never fabricates values when observations are pending or unavailable.
 */

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Cell,
} from 'recharts';
import { CloudRain, Satellite, AlertTriangle } from 'lucide-react';
import { DailyWeatherObs, SatelliteData } from '../services/api';

interface WeatherChartProps {
  dailyObservations?: DailyWeatherObs[];
  totalRainfallMm?: number | null;
  peakRainfallMm?: number | null;
  maxTempC?: number | null;
  weatherSource?: string;
  satelliteData?: SatelliteData | null;
  ndviBefore?: number | null;
  ndviAfter?: number | null;
  ndviChange?: number | null;
  preObsDate?: string | null;
  postObsDate?: string | null;
}

export const WeatherChart: React.FC<WeatherChartProps> = ({
  dailyObservations = [],
  totalRainfallMm,
  peakRainfallMm,
  maxTempC,
  weatherSource = 'Open-Meteo Historical Weather API (ERA5 / IFS Reanalysis)',
  satelliteData,
  ndviBefore,
  ndviAfter,
  ndviChange,
  preObsDate,
  postObsDate,
}) => {
  const effectivePreNdvi = ndviBefore ?? satelliteData?.ndvi_before ?? null;
  const effectivePostNdvi = ndviAfter ?? satelliteData?.ndvi_after ?? null;
  const effectiveChange = ndviChange ?? satelliteData?.ndvi_change ?? null;
  const effectivePreDate =
    preObsDate ?? satelliteData?.pre_event?.acquisition_date ?? 'Pre-Event';
  const effectivePostDate =
    postObsDate ?? satelliteData?.post_event?.acquisition_date ?? 'Post-Event';

  const ndviComparisonData =
    effectivePreNdvi !== null && effectivePostNdvi !== null
      ? [
          {
            stage: `Before (${effectivePreDate})`,
            ndvi: effectivePreNdvi,
            color: '#16a34a',
          },
          {
            stage: `After (${effectivePostDate})`,
            ndvi: effectivePostNdvi,
            color: '#dc2626',
          },
        ]
      : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Open-Meteo Daily Precipitation & Max Temperature */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-forest-700" />
              Open-Meteo Historical Rainfall & Temperature
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Source: {weatherSource}</p>
          </div>
          {totalRainfallMm !== null && totalRainfallMm !== undefined && (
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                Total Rain: {totalRainfallMm} mm
              </span>
              {peakRainfallMm !== null && peakRainfallMm !== undefined && (
                <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200">
                  Peak Day: {peakRainfallMm} mm
                </span>
              )}
              {maxTempC !== null && maxTempC !== undefined && (
                <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                  Max Temp: {maxTempC} °C
                </span>
              )}
            </div>
          )}
        </div>

        {dailyObservations && dailyObservations.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dailyObservations}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickFormatter={(val) => (val ? val.slice(5) : '')}
                />
                <YAxis
                  yAxisId="rain"
                  orientation="left"
                  tick={{ fontSize: 11, fill: '#1d4ed8' }}
                  label={{
                    value: 'Rainfall (mm)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 11, fill: '#1d4ed8' },
                  }}
                />
                <YAxis
                  yAxisId="temp"
                  orientation="right"
                  domain={[20, 42]}
                  tick={{ fontSize: 11, fill: '#d97706' }}
                  label={{
                    value: 'Max Temp (°C)',
                    angle: 90,
                    position: 'insideRight',
                    style: { fontSize: 11, fill: '#d97706' },
                  }}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  yAxisId="rain"
                  dataKey="precipitation_mm"
                  name="Daily Precipitation (mm)"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temp_max_c"
                  name="Max Temperature (°C)"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <CloudRain className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Weather observations not loaded yet
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Click <strong>"Run Agent 1 Damage Analysis"</strong> to retrieve real historical
              precipitation and temperature records from Open-Meteo for this field.
            </p>
          </div>
        )}
      </div>

      {/* Right Column: Sentinel-2 NDVI Comparison */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Satellite className="w-5 h-5 text-forest-700" />
            Sentinel-2 NDVI Change
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Formula: NDVI = (B8 − B4) / (B8 + B4)
          </p>
        </div>

        {ndviComparisonData.length > 0 ? (
          <>
            <div className="h-48 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ndviComparisonData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#334155' }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: '#334155' }} />
                  <Tooltip />
                  <Bar dataKey="ndvi" name="Canopy NDVI" radius={[6, 6, 0, 0]} barSize={48}>
                    {ndviComparisonData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 p-3 rounded-lg bg-forest-50 border border-forest-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Pre-Event ({effectivePreDate}):</span>
                <span className="font-bold text-forest-800">
                  {effectivePreNdvi?.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Post-Event ({effectivePostDate}):</span>
                <span className="font-bold text-red-700">
                  {effectivePostNdvi?.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-forest-200">
                <span className="font-semibold text-slate-800">Net NDVI Change:</span>
                <span className="font-bold text-red-700">
                  {effectiveChange !== null
                    ? `${effectiveChange > 0 ? '+' : ''}${effectiveChange.toFixed(4)}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="my-auto py-8 px-4 bg-amber-50/70 rounded-lg border border-amber-200 text-center space-y-2">
            <AlertTriangle className="w-7 h-7 text-amber-600 mx-auto" />
            <p className="text-xs font-semibold text-amber-900">
              {satelliteData?.satellite_available === false
                ? 'Satellite Imagery Unavailable (Weather-Only Mode)'
                : 'Satellite NDVI Pending Analysis'}
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              {satelliteData?.reason ||
                'No fake NDVI values are generated. Run Agent 1 assessment or select a field with verified cloud-free Sentinel-2 scenes (FIELD001 / FIELD002).'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherChart;
