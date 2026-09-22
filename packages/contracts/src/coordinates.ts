import type { Point } from "./core";

export type ThreePosition = readonly [xM: number, heightM: number, zM: number];

export function tableCmToWorld(point: Readonly<Point>): Readonly<Point> {
  return point;
}

export function tableMToWorld(point: Readonly<Point>): Readonly<Point> {
  return { x: point.x * 100, y: point.y * 100 };
}

export function worldToTableCm(point: Readonly<Point>): Readonly<Point> {
  return point;
}

export function worldToTableM(point: Readonly<Point>): Readonly<Point> {
  return { x: point.x / 100, y: point.y / 100 };
}

export function toThree(point: Readonly<Point>, heightM = 0): ThreePosition {
  return [point.x, heightM, -point.y];
}

export function fromThree(position: ThreePosition): Readonly<Point> {
  return { x: position[0], y: -position[2] };
}
