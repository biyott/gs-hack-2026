import type { Point2 } from "./linear-algebra";
import { finitePoint, GeometryError } from "./linear-algebra";

export { solveHomography, transformPoint } from "./homography";
export type { GeometryErrorCode, Homography, Point2, PointCorrespondence } from "./linear-algebra";
export { GeometryError } from "./linear-algebra";

export type HeightProjection = {
  readonly cameraXY: Point2;
  readonly cameraHeightM: number;
  readonly markerHeightM: number;
};

function scaled(point: Point2, factor: number): Point2 {
  finitePoint(point);
  const result = { x: point.x * factor, y: point.y * factor };
  finitePoint(result);
  return result;
}

export function tableMetersToWorldMeters(point: Point2): Point2 {
  return scaled(point, 100);
}

export function worldMetersToTableMeters(point: Point2): Point2 {
  return scaled(point, 0.01);
}

export function tableCentimetersToMeters(point: Point2): Point2 {
  return scaled(point, 0.01);
}

export function tableMetersToCentimeters(point: Point2): Point2 {
  return scaled(point, 100);
}

export function correctHeightProjection(planePoint: Point2, camera: HeightProjection): Point2 {
  const { cameraXY, cameraHeightM, markerHeightM } = camera;
  finitePoint(planePoint);
  finitePoint(cameraXY);
  if (
    !Number.isFinite(cameraHeightM) ||
    !Number.isFinite(markerHeightM) ||
    cameraHeightM <= 0 ||
    markerHeightM < 0 ||
    markerHeightM >= cameraHeightM
  ) {
    throw new GeometryError("invalid_height", "Marker height must be between the table and camera");
  }
  const ratio = markerHeightM / cameraHeightM;
  const result = {
    x: cameraXY.x * ratio + (1 - ratio) * planePoint.x,
    y: cameraXY.y * ratio + (1 - ratio) * planePoint.y,
  };
  finitePoint(result);
  return result;
}

export function rotateOffset(offset: Point2, headingRad: number): Point2 {
  finitePoint(offset);
  if (!Number.isFinite(headingRad)) {
    throw new GeometryError("invalid_input", "Heading must be finite radians");
  }
  const cosine = Math.cos(headingRad);
  const sine = Math.sin(headingRad);
  const result = { x: offset.x * cosine - offset.y * sine, y: offset.x * sine + offset.y * cosine };
  finitePoint(result);
  return result;
}
