/**
 * Sri Lanka district reference data + a city/town -> district lookup.
 *
 * `hc-key` values match the Highcharts Maps `countries/lk/lk-all.geo.json`
 * topology, vendored at `public/maps/lk-all.geo.json` (the CDN copy has no
 * CORS headers, so it can't be fetched client-side), so district counts can
 * be plotted directly as a choropleth without any further key translation.
 *
 * The `city` field on `User` is free text, so CITY_LOOKUP only covers the
 * major towns per district (plus common alternate spellings). Anything not
 * found here is reported separately as "unmatched" rather than guessed at.
 */

export interface District {
  key: string; // hc-key, e.g. "lk-co"
  name: string;
  lat: number;
  lon: number;
}

export const DISTRICTS: District[] = [
  { key: "lk-co", name: "Colombo", lat: 6.85989, lon: 80.0349 },
  { key: "lk-gq", name: "Gampaha", lat: 7.12599, lon: 80.0106 },
  { key: "lk-kt", name: "Kalutara", lat: 6.58989, lon: 80.1374 },
  { key: "lk-ky", name: "Kandy", lat: 7.30186, lon: 80.718 },
  { key: "lk-mt", name: "Matale", lat: 7.60919, lon: 80.7391 },
  { key: "lk-nw", name: "Nuwara Eliya", lat: 6.93625, lon: 80.6991 },
  { key: "lk-gl", name: "Galle", lat: 6.19513, lon: 80.2387 },
  { key: "lk-mh", name: "Matara", lat: 6.16548, lon: 80.5542 },
  { key: "lk-hb", name: "Hambantota", lat: 6.2704, lon: 81.1619 },
  { key: "lk-ja", name: "Jaffna", lat: 9.50669, lon: 79.6933 },
  { key: "lk-kl", name: "Kilinochchi", lat: 9.38429, lon: 80.3341 },
  { key: "lk-mp", name: "Mullaitivu", lat: 9.24043, lon: 80.5667 },
  { key: "lk-mb", name: "Mannar", lat: 8.84371, lon: 80.0854 },
  { key: "lk-va", name: "Vavuniya", lat: 8.89756, lon: 80.479 },
  { key: "lk-tc", name: "Trincomalee", lat: 8.56202, lon: 81.0848 },
  { key: "lk-bc", name: "Batticaloa", lat: 7.85079, lon: 81.4613 },
  { key: "lk-ap", name: "Ampara", lat: 7.1632, lon: 81.7242 },
  { key: "lk-kg", name: "Kurunegala", lat: 7.71298, lon: 80.2369 },
  { key: "lk-px", name: "Puttalam", lat: 7.94944, lon: 79.9111 },
  { key: "lk-ad", name: "Anuradhapura", lat: 8.29198, lon: 80.4711 },
  { key: "lk-pr", name: "Polonnaruwa", lat: 7.99997, lon: 81.048 },
  { key: "lk-bd", name: "Badulla", lat: 7.05184, lon: 81.0255 },
  { key: "lk-mj", name: "Monaragala", lat: 6.7224, lon: 81.3431 },
  { key: "lk-rn", name: "Ratnapura", lat: 6.57933, lon: 80.5623 },
  { key: "lk-ke", name: "Kegalle", lat: 7.08797, lon: 80.3478 },
];

const DISTRICT_BY_KEY = new Map(DISTRICTS.map(d => [d.key, d]));

export function districtName(key: string): string {
  return DISTRICT_BY_KEY.get(key)?.name ?? key;
}

interface CityEntry {
  district: string; // hc-key
  lat: number;
  lon: number;
  label: string; // canonical display name
}

// Major towns per district, plus common alternate spellings. Keys are lowercased.
const CITY_ENTRIES: [string[], Omit<CityEntry, "label"> & { label: string }][] = [
  [["colombo", "colombo 1", "col", "colombo city"], { district: "lk-co", lat: 6.9271, lon: 79.8612, label: "Colombo" }],
  [["dehiwala", "dehiwala-mount lavinia", "mount lavinia", "mt lavinia"], { district: "lk-co", lat: 6.8408, lon: 79.8736, label: "Dehiwala" }],
  [["moratuwa"], { district: "lk-co", lat: 6.773, lon: 79.8816, label: "Moratuwa" }],
  [["sri jayawardenepura kotte", "kotte", "battaramulla", "rajagiriya", "nugegoda"], { district: "lk-co", lat: 6.8929, lon: 79.9018, label: "Kotte" }],
  [["maharagama"], { district: "lk-co", lat: 6.848, lon: 79.9265, label: "Maharagama" }],
  [["homagama"], { district: "lk-co", lat: 6.8442, lon: 80.0025, label: "Homagama" }],
  [["kesbewa", "piliyandala"], { district: "lk-co", lat: 6.8, lon: 79.9226, label: "Piliyandala" }],
  [["kaduwela", "malabe", "kotikawatta"], { district: "lk-co", lat: 6.9337, lon: 79.9836, label: "Kaduwela" }],
  [["avissawella"], { district: "lk-co", lat: 6.9538, lon: 80.2094, label: "Avissawella" }],

  [["negombo"], { district: "lk-gq", lat: 7.2083, lon: 79.8358, label: "Negombo" }],
  [["gampaha"], { district: "lk-gq", lat: 7.0917, lon: 80.0, label: "Gampaha" }],
  [["ja-ela", "ja ela"], { district: "lk-gq", lat: 7.0744, lon: 79.8917, label: "Ja-Ela" }],
  [["wattala"], { district: "lk-gq", lat: 6.9897, lon: 79.8917, label: "Wattala" }],
  [["kelaniya"], { district: "lk-gq", lat: 6.9553, lon: 79.9219, label: "Kelaniya" }],
  [["kadawatha"], { district: "lk-gq", lat: 7.0008, lon: 79.9522, label: "Kadawatha" }],
  [["minuwangoda"], { district: "lk-gq", lat: 7.1706, lon: 79.9528, label: "Minuwangoda" }],
  [["wennappuwa"], { district: "lk-gq", lat: 7.3486, lon: 79.8397, label: "Wennappuwa" }],

  [["kalutara"], { district: "lk-kt", lat: 6.5854, lon: 79.9607, label: "Kalutara" }],
  [["panadura"], { district: "lk-kt", lat: 6.713, lon: 79.9068, label: "Panadura" }],
  [["horana"], { district: "lk-kt", lat: 6.7145, lon: 80.0632, label: "Horana" }],
  [["beruwala"], { district: "lk-kt", lat: 6.4788, lon: 79.9828, label: "Beruwala" }],
  [["aluthgama"], { district: "lk-kt", lat: 6.4322, lon: 79.9986, label: "Aluthgama" }],

  [["kandy", "maha nuwara"], { district: "lk-ky", lat: 7.2906, lon: 80.6337, label: "Kandy" }],
  [["peradeniya"], { district: "lk-ky", lat: 7.2599, lon: 80.5977, label: "Peradeniya" }],
  [["gampola"], { district: "lk-ky", lat: 7.1644, lon: 80.5742, label: "Gampola" }],
  [["katugastota"], { district: "lk-ky", lat: 7.3272, lon: 80.6255, label: "Katugastota" }],

  [["matale"], { district: "lk-mt", lat: 7.4675, lon: 80.6234, label: "Matale" }],
  [["dambulla"], { district: "lk-mt", lat: 7.8675, lon: 80.6517, label: "Dambulla" }],
  [["sigiriya"], { district: "lk-mt", lat: 7.957, lon: 80.7603, label: "Sigiriya" }],

  [["nuwara eliya", "nuwara-eliya"], { district: "lk-nw", lat: 6.9497, lon: 80.7891, label: "Nuwara Eliya" }],
  [["hatton"], { district: "lk-nw", lat: 6.8917, lon: 80.5958, label: "Hatton" }],
  [["talawakele"], { district: "lk-nw", lat: 6.9333, lon: 80.6583, label: "Talawakele" }],

  [["galle"], { district: "lk-gl", lat: 6.0535, lon: 80.221, label: "Galle" }],
  [["hikkaduwa"], { district: "lk-gl", lat: 6.1408, lon: 80.1006, label: "Hikkaduwa" }],
  [["ambalangoda"], { district: "lk-gl", lat: 6.235, lon: 80.0537, label: "Ambalangoda" }],
  [["baddegama"], { district: "lk-gl", lat: 6.1667, lon: 80.1833, label: "Baddegama" }],

  [["matara"], { district: "lk-mh", lat: 5.9549, lon: 80.5550, label: "Matara" }],
  [["weligama"], { district: "lk-mh", lat: 5.9739, lon: 80.4297, label: "Weligama" }],
  [["akuressa"], { district: "lk-mh", lat: 6.0967, lon: 80.4886, label: "Akuressa" }],

  [["hambantota"], { district: "lk-hb", lat: 6.1246, lon: 81.1185, label: "Hambantota" }],
  [["tangalle"], { district: "lk-hb", lat: 6.0242, lon: 80.7936, label: "Tangalle" }],
  [["tissamaharama", "tissa"], { district: "lk-hb", lat: 6.2833, lon: 81.2833, label: "Tissamaharama" }],

  [["jaffna"], { district: "lk-ja", lat: 9.6615, lon: 80.0255, label: "Jaffna" }],
  [["chavakachcheri"], { district: "lk-ja", lat: 9.6597, lon: 80.1614, label: "Chavakachcheri" }],
  [["point pedro"], { district: "lk-ja", lat: 9.8167, lon: 80.2333, label: "Point Pedro" }],

  [["kilinochchi"], { district: "lk-kl", lat: 9.3961, lon: 80.3982, label: "Kilinochchi" }],
  [["mullaitivu"], { district: "lk-mp", lat: 9.2671, lon: 80.8142, label: "Mullaitivu" }],
  [["mannar"], { district: "lk-mb", lat: 8.9769, lon: 79.9044, label: "Mannar" }],
  [["vavuniya"], { district: "lk-va", lat: 8.7514, lon: 80.4971, label: "Vavuniya" }],

  [["trincomalee", "trinco"], { district: "lk-tc", lat: 8.5874, lon: 81.2152, label: "Trincomalee" }],
  [["kinniya"], { district: "lk-tc", lat: 8.4919, lon: 81.1811, label: "Kinniya" }],

  [["batticaloa", "batti"], { district: "lk-bc", lat: 7.7102, lon: 81.6924, label: "Batticaloa" }],
  [["kalmunai"], { district: "lk-ap", lat: 7.4167, lon: 81.8167, label: "Kalmunai" }],
  [["ampara"], { district: "lk-ap", lat: 7.2975, lon: 81.6747, label: "Ampara" }],
  [["akkaraipattu"], { district: "lk-ap", lat: 7.2167, lon: 81.85, label: "Akkaraipattu" }],

  [["kurunegala"], { district: "lk-kg", lat: 7.4863, lon: 80.3623, label: "Kurunegala" }],
  [["kuliyapitiya"], { district: "lk-kg", lat: 7.4697, lon: 80.0419, label: "Kuliyapitiya" }],
  [["wariyapola"], { district: "lk-kg", lat: 7.6333, lon: 80.2333, label: "Wariyapola" }],

  [["puttalam"], { district: "lk-px", lat: 8.0362, lon: 79.8283, label: "Puttalam" }],
  [["chilaw"], { district: "lk-px", lat: 7.5759, lon: 79.7952, label: "Chilaw" }],
  [["marawila"], { district: "lk-px", lat: 7.4167, lon: 79.8333, label: "Marawila" }],

  [["anuradhapura"], { district: "lk-ad", lat: 8.3114, lon: 80.4037, label: "Anuradhapura" }],
  [["polonnaruwa"], { district: "lk-pr", lat: 7.9403, lon: 81.0188, label: "Polonnaruwa" }],

  [["badulla"], { district: "lk-bd", lat: 6.9934, lon: 81.055, label: "Badulla" }],
  [["bandarawela"], { district: "lk-bd", lat: 6.8333, lon: 80.9833, label: "Bandarawela" }],
  [["ella"], { district: "lk-bd", lat: 6.8667, lon: 81.0466, label: "Ella" }],

  [["monaragala", "moneragala"], { district: "lk-mj", lat: 6.8714, lon: 81.3507, label: "Monaragala" }],
  [["wellawaya"], { district: "lk-mj", lat: 6.7333, lon: 81.1, label: "Wellawaya" }],

  [["ratnapura"], { district: "lk-rn", lat: 6.6828, lon: 80.3992, label: "Ratnapura" }],
  [["embilipitiya"], { district: "lk-rn", lat: 6.3431, lon: 80.85, label: "Embilipitiya" }],

  [["kegalle", "kegalla"], { district: "lk-ke", lat: 7.2513, lon: 80.3464, label: "Kegalle" }],
  [["mawanella"], { district: "lk-ke", lat: 7.25, lon: 80.45, label: "Mawanella" }],
  [["warakapola"], { district: "lk-ke", lat: 7.2264, lon: 80.1972, label: "Warakapola" }],
];

const CITY_LOOKUP = new Map<string, CityEntry>();
for (const [aliases, entry] of CITY_ENTRIES) {
  for (const alias of aliases) CITY_LOOKUP.set(alias, entry);
}

export function resolveCity(raw: string): CityEntry | null {
  const key = raw.trim().toLowerCase();
  return CITY_LOOKUP.get(key) ?? null;
}
