type ToggleRouteIncludedObjectIdsParams = {
  includedObjectIds: string[];
  objectId: string;
  startHoldObjectId: string;
};

function dedupeObjectIds(objectIds: string[]) {
  return objectIds.filter(
    (objectId, index) => objectIds.indexOf(objectId) === index,
  );
}

export function toggleRouteIncludedObjectIds({
  includedObjectIds,
  objectId,
  startHoldObjectId,
}: ToggleRouteIncludedObjectIdsParams) {
  const normalizedIncludedObjectIds = dedupeObjectIds(
    includedObjectIds.includes(startHoldObjectId)
      ? includedObjectIds
      : [startHoldObjectId, ...includedObjectIds],
  );

  if (objectId === startHoldObjectId) {
    return normalizedIncludedObjectIds;
  }

  if (normalizedIncludedObjectIds.includes(objectId)) {
    return normalizedIncludedObjectIds.filter(
      (includedObjectId) => includedObjectId !== objectId,
    );
  }

  return [...normalizedIncludedObjectIds, objectId];
}
