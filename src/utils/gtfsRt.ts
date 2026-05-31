// Minimal, dependency-free GTFS-Realtime (protobuf) decoder. We only extract
// the fields the app needs — vehicle positions and stop-time arrivals — by
// walking the protobuf wire format directly (no protobufjs, so it bundles tiny
// in a Cloudflare Worker). Field numbers follow the GTFS-Realtime spec.

const td = new TextDecoder();

class Reader {
  private buf: Uint8Array;
  private dv: DataView;
  pos = 0;
  private len: number;
  constructor(buf: Uint8Array) {
    this.buf = buf;
    this.dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    this.len = buf.length;
  }
  get eof(): boolean {
    return this.pos >= this.len;
  }
  // Varints here (tags, int64 epoch times) stay well under 2^53, so float
  // accumulation is exact.
  varint(): number {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = this.buf[this.pos++];
      result += (b & 0x7f) * 2 ** shift;
      shift += 7;
    } while (b & 0x80);
    return result;
  }
  tag(): { field: number; wire: number } {
    const t = this.varint();
    return { field: Math.floor(t / 8), wire: t % 8 };
  }
  bytes(): Uint8Array {
    const n = this.varint();
    const out = this.buf.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }
  string(): string {
    return td.decode(this.bytes());
  }
  float(): number {
    const v = this.dv.getFloat32(this.pos, true);
    this.pos += 4;
    return v;
  }
  skip(wire: number): void {
    if (wire === 0) this.varint();
    else if (wire === 2) this.pos += this.varint();
    else if (wire === 5) this.pos += 4;
    else if (wire === 1) this.pos += 8;
  }
}

export interface RtVehicle {
  id: string;
  routeId: string;
  lat: number;
  lng: number;
}
export interface RtStopArrival {
  stopId: string;
  time: number | null; // epoch seconds
}
export interface RtTripUpdate {
  routeId: string;
  tripId: string;
  stops: RtStopArrival[];
}
export interface RtFeed {
  vehicles: RtVehicle[];
  tripUpdates: RtTripUpdate[];
}

// TripDescriptor: trip_id=1, route_id=5
function parseTrip(buf: Uint8Array): { tripId: string; routeId: string } {
  const r = new Reader(buf);
  let tripId = '';
  let routeId = '';
  while (!r.eof) {
    const { field, wire } = r.tag();
    if (field === 1 && wire === 2) tripId = r.string();
    else if (field === 5 && wire === 2) routeId = r.string();
    else r.skip(wire);
  }
  return { tripId, routeId };
}

// Position: latitude=1 (float), longitude=2 (float)
function parsePosition(buf: Uint8Array): { lat: number; lng: number } {
  const r = new Reader(buf);
  let lat = NaN;
  let lng = NaN;
  while (!r.eof) {
    const { field, wire } = r.tag();
    if (field === 1 && wire === 5) lat = r.float();
    else if (field === 2 && wire === 5) lng = r.float();
    else r.skip(wire);
  }
  return { lat, lng };
}

// VehicleDescriptor: id=1
function parseVehicleDescriptor(buf: Uint8Array): string {
  const r = new Reader(buf);
  let id = '';
  while (!r.eof) {
    const { field, wire } = r.tag();
    if (field === 1 && wire === 2) id = r.string();
    else r.skip(wire);
  }
  return id;
}

// VehiclePosition: trip=1, position=2, stop_id=7, vehicle=8
function parseVehicle(buf: Uint8Array): RtVehicle {
  const r = new Reader(buf);
  let routeId = '';
  let lat = NaN;
  let lng = NaN;
  let id = '';
  while (!r.eof) {
    const { field, wire } = r.tag();
    if (field === 1 && wire === 2) routeId = parseTrip(r.bytes()).routeId;
    else if (field === 2 && wire === 2) {
      const p = parsePosition(r.bytes());
      lat = p.lat;
      lng = p.lng;
    } else if (field === 8 && wire === 2) id = parseVehicleDescriptor(r.bytes());
    else r.skip(wire);
  }
  return { id, routeId, lat, lng };
}

// StopTimeEvent: time=2 (int64)
function parseStopTimeEvent(buf: Uint8Array): number | null {
  const r = new Reader(buf);
  let time: number | null = null;
  while (!r.eof) {
    const { field, wire } = r.tag();
    if (field === 2 && wire === 0) time = r.varint();
    else r.skip(wire);
  }
  return time;
}

// StopTimeUpdate: arrival=2, departure=3, stop_id=4
function parseStopTimeUpdate(buf: Uint8Array): RtStopArrival {
  const r = new Reader(buf);
  let stopId = '';
  let time: number | null = null;
  while (!r.eof) {
    const { field, wire } = r.tag();
    if (field === 4 && wire === 2) stopId = r.string();
    else if (field === 2 && wire === 2) time = parseStopTimeEvent(r.bytes());
    else if (field === 3 && wire === 2 && time === null) {
      time = parseStopTimeEvent(r.bytes()); // fall back to departure
    } else r.skip(wire);
  }
  return { stopId, time };
}

// TripUpdate: trip=1, stop_time_update=2
function parseTripUpdate(buf: Uint8Array): RtTripUpdate {
  const r = new Reader(buf);
  let routeId = '';
  let tripId = '';
  const stops: RtStopArrival[] = [];
  while (!r.eof) {
    const { field, wire } = r.tag();
    if (field === 1 && wire === 2) {
      const t = parseTrip(r.bytes());
      routeId = t.routeId;
      tripId = t.tripId;
    } else if (field === 2 && wire === 2) {
      stops.push(parseStopTimeUpdate(r.bytes()));
    } else r.skip(wire);
  }
  return { routeId, tripId, stops };
}

// FeedMessage: entity=2 ; FeedEntity: trip_update=3, vehicle=4
export function decodeFeedMessage(buf: Uint8Array): RtFeed {
  const r = new Reader(buf);
  const vehicles: RtVehicle[] = [];
  const tripUpdates: RtTripUpdate[] = [];
  while (!r.eof) {
    const { field, wire } = r.tag();
    if (field === 2 && wire === 2) {
      const ent = new Reader(r.bytes());
      while (!ent.eof) {
        const f = ent.tag();
        if (f.field === 3 && f.wire === 2) tripUpdates.push(parseTripUpdate(ent.bytes()));
        else if (f.field === 4 && f.wire === 2) vehicles.push(parseVehicle(ent.bytes()));
        else ent.skip(f.wire);
      }
    } else r.skip(wire);
  }
  return { vehicles, tripUpdates };
}
