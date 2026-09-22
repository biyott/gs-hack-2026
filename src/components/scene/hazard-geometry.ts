import { Shape, ShapeGeometry, Vector2 } from "three";
import type { Point } from "@/contracts";

export function createHazardGeometry(polygon: readonly Readonly<Point>[]): ShapeGeometry | null {
  if (polygon.length < 3) return null;
  return new ShapeGeometry(new Shape(polygon.map((point) => new Vector2(point.x, point.y))));
}
