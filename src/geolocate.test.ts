/**
 * Copyright 2020 Google LLC
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
import { GeolocateRequest, geolocate, defaultUrl } from "./geolocate";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
  jest.clearAllMocks();
});

test("elevation should call axios correctly", () => {
  const params = { key: "foo" };
  const data = { considerIp: false };
  geolocate({ params: params, data: data }, mockedAxios);

  expect(mockedAxios).toHaveBeenCalledTimes(1);
  expect(mockedAxios).toHaveBeenCalledWith({
    method: "post",
    params: params,
    data: data,
    url: defaultUrl,
  });
});

test("geolocate should pass caller config to axios", () => {
  const params = { key: "foo" };
  const data = { considerIp: false };
  geolocate({ params, data, timeout: 1000 }, mockedAxios);

  expect(mockedAxios).toHaveBeenCalledWith({
    method: "post",
    params,
    data,
    url: defaultUrl,
    timeout: 1000,
  });
});

test("geolocate should reject Premium Plan params without calling axios", async () => {
  const premiumPlanParams = [
    { client_id: "gme-example", client_secret: "DUMMY_SIGNING_SECRET" },
    { key: "foo", client_secret: "DUMMY_SIGNING_SECRET" },
    { key: "foo", client_id: "gme-example" },
  ];

  for (const params of premiumPlanParams) {
    // Bypass the type, as a JavaScript caller would.
    const request = geolocate(
      { params: params as unknown as GeolocateRequest["params"], data: {} },
      mockedAxios
    );

    await expect(request).rejects.toThrow(
      "The Geolocation API accepts only API key authentication (params.key); client_id and client_secret are not supported."
    );
  }
  expect(mockedAxios).not.toHaveBeenCalled();
});

test("geolocate should ignore undefined Premium Plan params", () => {
  const params = { key: "foo", client_id: undefined, client_secret: undefined };
  geolocate({ params, data: {} }, mockedAxios);

  expect(mockedAxios).toHaveBeenCalledWith({
    method: "post",
    params,
    data: {},
    url: defaultUrl,
  });
});

test("GeolocateRequest should accept only API key params", async () => {
  const request: GeolocateRequest = {
    // @ts-expect-error Premium Plan params are not supported.
    params: { client_id: "gme-example", client_secret: "DUMMY_SIGNING_SECRET" },
    data: {},
  };

  await expect(geolocate(request, mockedAxios)).rejects.toThrow(
    "only API key authentication"
  );
});
