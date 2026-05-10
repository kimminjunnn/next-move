import type { Point2D } from "../types/geometry";

export function addPoints(a: Point2D, b: Point2D): Point2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtractPoints(a: Point2D, b: Point2D): Point2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scalePoint(point: Point2D, scale: number): Point2D {
  return { x: point.x * scale, y: point.y * scale };
}

export function distanceBetweenPoints(a: Point2D, b: Point2D) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: Point2D, b: Point2D): Point2D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function rotatePoint90(point: Point2D, direction: 1 | -1): Point2D {
  return {
    x: -point.y * direction,
    y: point.x * direction,
  };
}
