/** A Sri Lankan district shaded on the admin dashboard map. */
export interface MapDistrict {
  "hc-key": string;
  name: string;
  value: number;
}

/** A plotted town/city bubble on the admin dashboard map. */
export interface MapCity {
  name: string;
  lat: number;
  lon: number;
  count: number;
}
