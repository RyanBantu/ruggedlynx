export type MovebankStudySeed = {
  id: number
  name: string
  lat: number
  lon: number
  taxa: string
}

/** Mirrors api/movebank.js curated catalog for typed client use if needed. */
export const MOVEBANK_SEEDS: MovebankStudySeed[] = [
  { id: 1764627, name: 'Turkey Vulture eastern migration', lat: 40.0, lon: -76.0, taxa: 'Turkey Vulture' },
  { id: 2988647, name: 'Osprey migration Atlantic', lat: 39.0, lon: -75.5, taxa: 'Osprey' },
  { id: 9862091, name: 'Golden Eagle western NA', lat: 45.0, lon: -114.0, taxa: 'Golden Eagle' },
  { id: 10449318, name: 'Bald Eagle Great Lakes', lat: 45.0, lon: -85.0, taxa: 'Bald Eagle' },
  { id: 1774360, name: 'White-tailed deer GPS (public subset)', lat: 43.0, lon: -89.0, taxa: 'Whitetail' },
  { id: 2123140, name: 'Elk Rocky Mountain public tracks', lat: 44.5, lon: -110.5, taxa: 'Elk' },
  { id: 2920540, name: 'Mule deer Great Basin', lat: 40.5, lon: -115.0, taxa: 'Mule Deer' },
  { id: 3909476, name: 'Black bear Appalachian', lat: 35.5, lon: -83.5, taxa: 'Black Bear' },
  { id: 1610313967, name: 'Wolf Great Lakes', lat: 47.0, lon: -91.0, taxa: 'Gray Wolf' },
  { id: 657178031, name: 'Caribou Alaska herds', lat: 66.0, lon: -150.0, taxa: 'Caribou' },
  { id: 985141241, name: 'Moose northern Rockies', lat: 48.0, lon: -114.0, taxa: 'Moose' },
  { id: 10449357, name: 'Pronghorn northern plains', lat: 45.0, lon: -105.0, taxa: 'Pronghorn' },
  { id: 1764587, name: 'Sandhill Crane migration', lat: 41.0, lon: -98.0, taxa: 'Sandhill Crane' },
  { id: 2921001, name: 'California condor range', lat: 36.0, lon: -118.5, taxa: 'Condor' },
  { id: 10449290, name: 'Cougar Pacific Northwest', lat: 46.0, lon: -122.0, taxa: 'Cougar' },
  { id: 3909500, name: 'Bighorn sheep Southwest', lat: 36.0, lon: -113.0, taxa: 'Bighorn' },
  { id: 657178100, name: 'Arctic fox Alaska', lat: 70.0, lon: -148.0, taxa: 'Arctic Fox' },
]
