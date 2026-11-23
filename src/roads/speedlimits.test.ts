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

import axios from "axios";
import { Client } from "../client";
import {
  SpeedLimitUnits,
  SpeedLimitsRequest,
  SpeedLimitsResponseData,
} from "./speedlimits";

interface RecordedRequest {
  method: string;
  url: URL;
}

// Builds a Client whose requests are recorded instead of sent.
function recordingClient(): { client: Client; requests: RecordedRequest[] } {
  const requests: RecordedRequest[] = [];
  const axiosInstance = axios.create({
    adapter: async (config) => {
      requests.push({
        method: config.method,
        url: new URL(axios.getUri(config)),
      });
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    },
  });
  return { client: new Client({ axiosInstance }), requests };
}

// The expected values are the example requests on
// https://developers.google.com/maps/documentation/roads/speed-limits
test("speedLimits sends a path as pipe-separated coordinates", async () => {
  const { client, requests } = recordingClient();

  await client.speedLimits({
    params: {
      path: [
        "38.75807927603043,-9.03741754643809",
        "38.6896537,-9.1770515",
        "41.1399289,-8.6094075",
      ],
      key: "foo",
    },
  });

  expect(requests).toHaveLength(1);
  const { method, url } = requests[0];
  expect(method).toEqual("get");
  expect(url.origin + url.pathname).toEqual(
    "https://roads.googleapis.com/v1/speedLimits"
  );
  expect([...url.searchParams]).toEqual([
    ["key", "foo"],
    [
      "path",
      "38.75807927603043,-9.03741754643809|38.6896537,-9.1770515|41.1399289,-8.6094075",
    ],
  ]);
});

test("speedLimits sends each place ID as its own placeId key", async () => {
  const { client, requests } = recordingClient();

  await client.speedLimits({
    params: {
      placeId: [
        "ChIJX12duJAwGQ0Ra0d4Oi4jOGE",
        "ChIJLQcticc0GQ0RoiNZJVa5GxU",
        "ChIJJ4vQRudkJA0RpednU70A-5M",
      ],
      key: "foo",
    },
  });

  expect(requests).toHaveLength(1);
  const { method, url } = requests[0];
  expect(method).toEqual("get");
  expect(url.origin + url.pathname).toEqual(
    "https://roads.googleapis.com/v1/speedLimits"
  );
  expect([...url.searchParams]).toEqual([
    ["key", "foo"],
    ["placeId", "ChIJX12duJAwGQ0Ra0d4Oi4jOGE"],
    ["placeId", "ChIJLQcticc0GQ0RoiNZJVa5GxU"],
    ["placeId", "ChIJJ4vQRudkJA0RpednU70A-5M"],
  ]);
});

test("speedLimits sends units", async () => {
  const { client, requests } = recordingClient();

  await client.speedLimits({
    params: {
      placeId: ["ChIJX12duJAwGQ0Ra0d4Oi4jOGE"],
      units: SpeedLimitUnits.MPH,
      key: "foo",
    },
  });

  expect(requests[0].url.searchParams.get("units")).toEqual("MPH");
});

// The checks below happen at compile time: ts-jest and the build fail if a
// line marked @ts-expect-error compiles, or if any other line doesn't.
const asRequest = (r: SpeedLimitsRequest) => r;

test("SpeedLimitsRequest takes either a path or place IDs, with an API key", () => {
  asRequest({ params: { path: ["0,0"], key: "foo" } });
  asRequest({
    params: { placeId: ["a"], units: SpeedLimitUnits.KPH, key: "foo" },
  });
  // @ts-expect-error A request takes a path or place IDs, not both.
  asRequest({ params: { path: ["0,0"], placeId: ["a"], key: "foo" } });
  // @ts-expect-error A request needs a path or place IDs.
  asRequest({ params: { key: "foo" } });
  asRequest({
    params: {
      placeId: ["a"],
      // @ts-expect-error The Speed Limit service accepts only API keys.
      client_id: "gme-example",
      client_secret: "DUMMY_SIGNING_SECRET",
    },
  });
});

const asResponseData = (d: SpeedLimitsResponseData) => d;

// The first two fixtures are cut down from the example responses on the
// reference page.
test("SpeedLimitsResponseData fits the documented responses", () => {
  asResponseData({
    speedLimits: [
      {
        placeId: "ChIJX12duJAwGQ0Ra0d4Oi4jOGE",
        speedLimit: 105,
        units: SpeedLimitUnits.KPH,
      },
    ],
    snappedPoints: [
      {
        location: {
          latitude: 38.75807927603043,
          longitude: -9.037417546438084,
        },
        originalIndex: 0,
        placeId: "ChIJX12duJAwGQ0Ra0d4Oi4jOGE",
      },
    ],
    warningMessage: "Input path is too sparse.",
  });
  asResponseData({
    speedLimits: [
      {
        placeId: "ChIJX12duJAwGQ0Ra0d4Oi4jOGE",
        speedLimit: 105,
        units: SpeedLimitUnits.KPH,
      },
    ],
  });
  // No road segments among the requested place IDs.
  asResponseData({});
});
