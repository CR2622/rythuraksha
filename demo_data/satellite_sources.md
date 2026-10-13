# Satellite & Weather Evidence Documentation (`RythuRaksha AI`)

**VNR VJIET AI Engineering Hackathon | Team 33**

## 1. Scientific Integrity Policy (No Fabricated Data)
In accordance with the RythuRaksha AI engineering protocol:
1. **Weather Observations**: Retrieved dynamically from the **Open-Meteo Historical Weather API** (`https://archive-api.open-meteo.com/v1/archive`) using the selected field's exact GPS coordinates (`lat`, `lon`) and historical event window (`2024-08-28` to `2024-09-06` during the Telangana extreme monsoon depression).
2. **Satellite Spectral Evidence**: When live Google Earth Engine access is not active on the demonstration laptop, the system loads documented, preprocessed **ESA Copernicus Sentinel-2 Level-2A** surface reflectance observations (`B04 Red` and `B08 Near-Infrared`) from `demo_data/verified_satellite_data.json`, explicitly labeled as **Preprocessed Historical Sentinel-2 Evidence** with exact scene IDs and acquisition dates.
3. **Missing Imagery Handling (`FIELD003`)**: When cloud-free post-event imagery is unavailable, `backend/satellite.py` returns `null` for NDVI metrics and sets `evidence_quality = "weather_only_satellite_unavailable"`. The system never invents or fabricates NDVI values.

---

## 2. NDVI Formula & Calculation
Normalized Difference Vegetation Index ($\text{NDVI}$) is calculated in `backend/satellite.py` directly from 10m surface reflectance bands:

$$\text{NDVI} = \frac{B_8 - B_4}{B_8 + B_4}$$

Where:
- $B_8$: Sentinel-2 Band 8 (Near-Infrared, $842\text{ nm}$)
- $B_4$: Sentinel-2 Band 4 (Red, $665\text{ nm}$)

### Verified Field Calculations
| Field ID | Location | Pre-Event Date (`B4`, `B8`) | Pre NDVI | Post-Event Date (`B4`, `B8`) | Post NDVI | NDVI Change ($\Delta$) |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `FIELD001` | Warangal, TS (Paddy) | `2024-08-25` (`0.052`, `0.364`) | `0.7500` | `2024-09-09` (`0.118`, `0.254`) | `0.3656` | `-0.3844` (`-51.25%`) |
| `FIELD002` | Khammam, TS (Chilli) | `2024-08-25` (`0.064`, `0.356`) | `0.6952` | `2024-09-09` (`0.134`, `0.232`) | `0.2678` | `-0.4274` (`-61.48%`) |
| `FIELD003` | Nalgonda, TS (Cotton) | Cloud Obscured | `null` | Cloud Obscured | `null` | `null` (Weather-Only) |

---

## 3. Limitations & Human-in-the-Loop Verification
- **Vegetation Decline $\neq$ Confirmed Financial Crop Loss**: Satellite NDVI measures reductions in chlorophyll activity and canopy vigour. While a sharp NDVI drop coinciding with extreme rainfall ($>100\text{ mm}$) is strong preliminary evidence of inundation damage, final insurance payouts and loan relief approvals require review by an authorized bank or insurance officer in the **Institutional Reviewer Portal**.
