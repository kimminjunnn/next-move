import type {
  RouteSelectionResult,
  SimulationPhoto,
  WallAnalysisResult,
} from "../types/simulation";

const WALL_API_BASE_URL =
  process.env.EXPO_PUBLIC_WALL_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

function buildFilePayload(photo: SimulationPhoto) {
  const filename = photo.uri.split("/").pop() || `wall-photo-${photo.updatedAt}.jpg`;
  const extension = filename.split(".").pop()?.toLowerCase();
  const type =
    extension === "png" ? "image/png" : extension === "heic" ? "image/heic" : "image/jpeg";

  return {
    uri: photo.uri,
    name: filename,
    type,
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: { message?: string } }
    | null;
  const errorPayload =
    payload && typeof payload === "object" && "error" in payload
      ? payload.error
      : null;

  if (!response.ok) {
    const message = errorPayload?.message || "서버 요청에 실패했습니다.";

    throw new Error(message);
  }

  return payload as T;
}

export async function createWallAnalysis(
  photo: SimulationPhoto,
): Promise<WallAnalysisResult> {
  const formData = new FormData();
  formData.append("source", photo.source);
  formData.append("file", buildFilePayload(photo) as never);
  const requestUrl = `${WALL_API_BASE_URL}/api/v1/wall-analyses`;

  console.log("[route-detection] createWallAnalysis ->", {
    url: requestUrl,
    photoUri: photo.uri,
    source: photo.source,
  });

  const response = await fetch(requestUrl, {
    method: "POST",
    body: formData,
  });

  const payload = await parseJsonResponse<{ analysis: WallAnalysisResult }>(response);
  console.log("[route-detection] createWallAnalysis <-", {
    analysisId: payload.analysis.id,
    objectCount: payload.analysis.objects.length,
  });
  return payload.analysis;
}

export async function selectDetectedRoute(params: {
  analysisId: string;
  startHoldObjectId: string;
}): Promise<RouteSelectionResult> {
  const { analysisId, startHoldObjectId } = params;
  const requestUrl = `${WALL_API_BASE_URL}/api/v1/wall-analyses/${analysisId}/route`;

  console.log("[route-detection] selectDetectedRoute ->", {
    url: requestUrl,
    analysisId,
    startHoldObjectId,
  });

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ startHoldObjectId }),
  });

  const payload = await parseJsonResponse<{ route: RouteSelectionResult }>(response);
  console.log("[route-detection] selectDetectedRoute <-", {
    analysisId: payload.route.analysisId,
    includedObjectIds: payload.route.includedObjectIds,
  });
  return payload.route;
}
