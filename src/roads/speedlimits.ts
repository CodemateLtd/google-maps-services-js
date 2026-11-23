/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ApiKeyParams, LatLng, SnappedPoint } from "../common";
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { defaultAxiosInstance } from "../client";
import { serializer, latLngToString } from "../serialize";

/** The units a speed limit is requested and returned in. */
export enum SpeedLimitUnits {
  /** Kilometers per hour. */
  KPH = "KPH",
  /** Miles per hour. */
  MPH = "MPH",
}

export interface SpeedLimitsPathParams {
  /**
   * A list of up to 100 latitude/longitude pairs representing a path. The API first snaps the path
   * to the most likely road traveled by a vehicle, as `snapToRoads` does, then returns the speed
   * limit for each road segment. For example:
   * `path=60.170880,24.942795|60.170879,24.942796|60.170877,24.942796`.
   */
  path: LatLng[];
  /** Not allowed with `path`. */
  placeId?: never;
}

export interface SpeedLimitsPlaceIdParams {
  /**
   * The place IDs of up to 100 road segments. The API doesn't snap them to roads, and returns no
   * speed limit for a place ID that isn't a road segment. Use `snapToRoads` or `nearestRoads` to
   * get road-segment place IDs. Each place ID is sent as its own `placeId` query parameter.
   */
  placeId: string[];
  /** Not allowed with `placeId`. */
  path?: never;
}

export interface SpeedLimitsRequest extends Partial<AxiosRequestConfig> {
  params: (SpeedLimitsPathParams | SpeedLimitsPlaceIdParams) & {
    /**
     * Whether to return speed limits in kilometers or miles per hour.
     *
     * @default SpeedLimitUnits.KPH
     */
    units?: SpeedLimitUnits;
  } & ApiKeyParams;
}

export interface SpeedLimit {
  /** The place ID of the road segment. */
  placeId: string;
  /** The speed limit for the road segment. */
  speedLimit: number;
  /** The units of `speedLimit`. */
  units: SpeedLimitUnits;
}

export interface SpeedLimitsResponseData {
  /**
   * The speed limit for each road segment. Empty or missing when none of the requested place IDs is
   * a road segment.
   */
  speedLimits?: SpeedLimit[];
  /** The snapped points. Present only when the request contained a `path`. */
  snappedPoints?: SnappedPoint[];
  /** A user-visible warning, such as a path whose points are too far apart. */
  warningMessage?: string;
}

export interface SpeedLimitsResponse extends AxiosResponse {
  data: SpeedLimitsResponseData;
}

export const defaultUrl = "https://roads.googleapis.com/v1/speedLimits";
export const defaultParamsSerializer = serializer(
  {
    path: (o) => o.map(latLngToString).join("|"),
  },
  defaultUrl,
  // Sends each place ID as its own placeId parameter. The default options
  // join array elements with "|".
  { arrayFormat: "none" }
);

export function speedLimits(
  {
    params,
    method = "get",
    url = defaultUrl,
    paramsSerializer = defaultParamsSerializer,
    ...config
  }: SpeedLimitsRequest,
  axiosInstance: AxiosInstance = defaultAxiosInstance
): Promise<SpeedLimitsResponse> {
  return axiosInstance({
    params,
    method,
    url,
    paramsSerializer,
    ...config,
  }) as Promise<SpeedLimitsResponse>;
}
