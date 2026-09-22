export const ANNOTATION_LABEL_MAX_WIDTH = 98;
export const ANNOTATION_LABEL_HEIGHT = 44;
export const ANNOTATION_MARGIN = 4;
export const ANNOTATION_GAP = 4;

export type AnnotationAnchor = {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly priority: number;
};

export interface PlacedAnnotation extends AnnotationAnchor {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export type AnnotationViewport = {
  readonly width: number;
  readonly height: number;
};

type LabelPosition = {
  readonly left: number;
  readonly top: number;
};

export function placeAnnotations(
  anchors: readonly AnnotationAnchor[],
  viewport: AnnotationViewport,
): readonly PlacedAnnotation[] {
  if (!labelCanFit(viewport)) {
    return [];
  }

  const placed: PlacedAnnotation[] = [];
  const orderedAnchors = anchors
    .filter((anchor) => anchorIsVisible(anchor, viewport))
    .toSorted(compareAnchors);

  for (const anchor of orderedAnchors) {
    const nearbyPosition = nearbyPositions(anchor, viewport).find((position) =>
      positionIsAvailable(position, placed),
    );
    const position = nearbyPosition ?? closestGridPosition(anchor, viewport, placed);
    if (position) {
      placed.push({
        ...anchor,
        ...position,
        width: ANNOTATION_LABEL_MAX_WIDTH,
        height: ANNOTATION_LABEL_HEIGHT,
      });
    }
  }

  if (placed.length === orderedAnchors.length) {
    return placed;
  }
  const packed = packedAnnotations(orderedAnchors, viewport);
  return packed.length > placed.length ? packed : placed;
}

function packedAnnotations(
  anchors: readonly AnnotationAnchor[],
  viewport: AnnotationViewport,
): readonly PlacedAnnotation[] {
  const columns = Math.floor(
    (viewport.width - ANNOTATION_MARGIN * 2 + ANNOTATION_GAP) /
      (ANNOTATION_LABEL_MAX_WIDTH + ANNOTATION_GAP),
  );
  const rows = Math.floor(
    (viewport.height - ANNOTATION_MARGIN * 2 + ANNOTATION_GAP) /
      (ANNOTATION_LABEL_HEIGHT + ANNOTATION_GAP),
  );
  return anchors.slice(0, columns * rows).map((anchor, index) => ({
    ...anchor,
    left: ANNOTATION_MARGIN + (index % columns) * (ANNOTATION_LABEL_MAX_WIDTH + ANNOTATION_GAP),
    top:
      ANNOTATION_MARGIN + Math.floor(index / columns) * (ANNOTATION_LABEL_HEIGHT + ANNOTATION_GAP),
    width: ANNOTATION_LABEL_MAX_WIDTH,
    height: ANNOTATION_LABEL_HEIGHT,
  }));
}

function labelCanFit(viewport: AnnotationViewport): boolean {
  return (
    viewport.width >= ANNOTATION_LABEL_MAX_WIDTH + ANNOTATION_MARGIN * 2 &&
    viewport.height >= ANNOTATION_LABEL_HEIGHT + ANNOTATION_MARGIN * 2
  );
}

function anchorIsVisible(anchor: AnnotationAnchor, viewport: AnnotationViewport): boolean {
  return (
    anchor.x >= 0 && anchor.x <= viewport.width && anchor.y >= 0 && anchor.y <= viewport.height
  );
}

function compareAnchors(first: AnnotationAnchor, second: AnnotationAnchor): number {
  if (first.priority !== second.priority) {
    return first.priority - second.priority;
  }
  if (first.id < second.id) {
    return -1;
  }
  return first.id > second.id ? 1 : 0;
}

function nearbyPositions(
  anchor: AnnotationAnchor,
  viewport: AnnotationViewport,
): readonly LabelPosition[] {
  const positions = [
    { left: anchor.x + ANNOTATION_GAP, top: anchor.y + ANNOTATION_GAP },
    { left: anchor.x + ANNOTATION_GAP, top: anchor.y - ANNOTATION_LABEL_HEIGHT - ANNOTATION_GAP },
    {
      left: anchor.x - ANNOTATION_LABEL_MAX_WIDTH - ANNOTATION_GAP,
      top: anchor.y + ANNOTATION_GAP,
    },
    {
      left: anchor.x - ANNOTATION_LABEL_MAX_WIDTH - ANNOTATION_GAP,
      top: anchor.y - ANNOTATION_LABEL_HEIGHT - ANNOTATION_GAP,
    },
    {
      left: anchor.x - ANNOTATION_LABEL_MAX_WIDTH / 2,
      top: anchor.y + ANNOTATION_GAP,
    },
    {
      left: anchor.x - ANNOTATION_LABEL_MAX_WIDTH / 2,
      top: anchor.y - ANNOTATION_LABEL_HEIGHT - ANNOTATION_GAP,
    },
    { left: anchor.x + ANNOTATION_GAP, top: anchor.y - ANNOTATION_LABEL_HEIGHT / 2 },
    {
      left: anchor.x - ANNOTATION_LABEL_MAX_WIDTH - ANNOTATION_GAP,
      top: anchor.y - ANNOTATION_LABEL_HEIGHT / 2,
    },
  ];

  return positions.map((position) => clampPosition(position, viewport));
}

function closestGridPosition(
  anchor: AnnotationAnchor,
  viewport: AnnotationViewport,
  placed: readonly PlacedAnnotation[],
): LabelPosition | undefined {
  let closest: LabelPosition | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const left of gridValues(ANNOTATION_MARGIN, maxLeft(viewport))) {
    for (const top of gridValues(ANNOTATION_MARGIN, maxTop(viewport))) {
      const position = { left, top };
      if (!positionIsAvailable(position, placed)) {
        continue;
      }
      const distance = distanceToAnchor(position, anchor);
      if (distance < closestDistance) {
        closest = position;
        closestDistance = distance;
      }
    }
  }

  return closest;
}

function gridValues(minimum: number, maximum: number): readonly number[] {
  const values: number[] = [];
  for (let value = minimum; value <= maximum; value += ANNOTATION_GAP) {
    values.push(value);
  }
  if (values.at(-1) !== maximum) {
    values.push(maximum);
  }
  return values;
}

function distanceToAnchor(position: LabelPosition, anchor: AnnotationAnchor): number {
  const horizontal = position.left + ANNOTATION_LABEL_MAX_WIDTH / 2 - anchor.x;
  const vertical = position.top + ANNOTATION_LABEL_HEIGHT / 2 - anchor.y;
  return horizontal ** 2 + vertical ** 2;
}

function positionIsAvailable(
  position: LabelPosition,
  placed: readonly PlacedAnnotation[],
): boolean {
  return placed.every(
    (label) =>
      position.left + ANNOTATION_LABEL_MAX_WIDTH + ANNOTATION_GAP <= label.left ||
      label.left + label.width + ANNOTATION_GAP <= position.left ||
      position.top + ANNOTATION_LABEL_HEIGHT + ANNOTATION_GAP <= label.top ||
      label.top + label.height + ANNOTATION_GAP <= position.top,
  );
}

function clampPosition(position: LabelPosition, viewport: AnnotationViewport): LabelPosition {
  return {
    left: Math.min(maxLeft(viewport), Math.max(ANNOTATION_MARGIN, position.left)),
    top: Math.min(maxTop(viewport), Math.max(ANNOTATION_MARGIN, position.top)),
  };
}

function maxLeft(viewport: AnnotationViewport): number {
  return viewport.width - ANNOTATION_LABEL_MAX_WIDTH - ANNOTATION_MARGIN;
}

function maxTop(viewport: AnnotationViewport): number {
  return viewport.height - ANNOTATION_LABEL_HEIGHT - ANNOTATION_MARGIN;
}
