import { describe, expect, it } from 'vitest';
import { decodeFeedMessage } from './gtfsRt';

// Tiny protobuf encoder, just enough to build a GTFS-RT FeedMessage to decode.
function varint(n: number): number[] {
  const out: number[] = [];
  while (n > 0x7f) {
    out.push((n & 0x7f) | 0x80);
    n = Math.floor(n / 128);
  }
  out.push(n);
  return out;
}
const tag = (field: number, wire: number) => varint(field * 8 + wire);
const lenDelim = (field: number, bytes: number[]) => [
  ...tag(field, 2),
  ...varint(bytes.length),
  ...bytes,
];
const str = (field: number, s: string) =>
  lenDelim(field, [...new TextEncoder().encode(s)]);
const vint = (field: number, n: number) => [...tag(field, 0), ...varint(n)];
function f32(field: number, val: number): number[] {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setFloat32(0, val, true);
  return [...tag(field, 5), ...b];
}

describe('decodeFeedMessage', () => {
  it('decodes vehicle positions and trip-update arrivals', () => {
    const trip = [...str(1, 'TRIPV'), ...str(5, 'L6')]; // TripDescriptor trip_id + route_id
    const pos = [...f32(1, 41.3873), ...f32(2, 2.1699)]; // Position lat/lng
    const vd = str(1, 'v123'); // VehicleDescriptor.id
    const vehiclePosition = [
      ...lenDelim(1, trip),
      ...lenDelim(2, pos),
      ...lenDelim(8, vd),
    ];
    const entity1 = lenDelim(4, vehiclePosition); // FeedEntity.vehicle

    const tu_trip = [...str(1, 't1'), ...str(5, 'S1')]; // trip_id + route_id
    const stEvent = vint(2, 1750000000); // StopTimeEvent.time
    const stu = [...str(4, '001234'), ...lenDelim(2, stEvent)]; // stop_id + arrival
    const tripUpdate = [...lenDelim(1, tu_trip), ...lenDelim(2, stu)];
    const entity2 = lenDelim(3, tripUpdate); // FeedEntity.trip_update

    const feed = Uint8Array.from([
      ...lenDelim(2, entity1),
      ...lenDelim(2, entity2),
    ]);

    const { vehicles, tripUpdates } = decodeFeedMessage(feed);

    expect(vehicles).toHaveLength(1);
    expect(vehicles[0].id).toBe('v123');
    expect(vehicles[0].routeId).toBe('L6');
    expect(vehicles[0].tripId).toBe('TRIPV');
    expect(vehicles[0].lat).toBeCloseTo(41.3873, 3);
    expect(vehicles[0].lng).toBeCloseTo(2.1699, 3);

    expect(tripUpdates).toHaveLength(1);
    expect(tripUpdates[0].routeId).toBe('S1');
    expect(tripUpdates[0].stops).toHaveLength(1);
    expect(tripUpdates[0].stops[0].stopId).toBe('001234');
    expect(tripUpdates[0].stops[0].time).toBe(1750000000);
  });
});
