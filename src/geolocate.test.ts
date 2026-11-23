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

test("geolocate should remove Premium Plan params before calling axios", () => {
  const cases = [
    {
      params: {
        client_id: "gme-example",
        client_secret: "DUMMY_SIGNING_SECRET",
      },
      expected: {},
    },
    {
      params: {
        key: "foo",
        client_id: "gme-example",
        client_secret: "DUMMY_SIGNING_SECRET",
      },
      expected: { key: "foo" },
    },
    {
      params: { key: "foo", client_secret: "DUMMY_SIGNING_SECRET" },
      expected: { key: "foo" },
    },
    { params: { key: "foo", client_id: "" }, expected: { key: "foo" } },
    {
      params: { key: "foo", client_id: null, client_secret: null },
      expected: { key: "foo" },
    },
  ];

  for (const { params, expected } of cases) {
    // Bypass the type, as a JavaScript caller would.
    geolocate(
      {
        params: params as unknown as GeolocateRequest["params"],
        data: { considerIp: false },
      },
      mockedAxios
    );

    expect(mockedAxios).toHaveBeenLastCalledWith({
      method: "post",
      params: expected,
      data: { considerIp: false },
      url: defaultUrl,
    });
  }
});

test("geolocate should remove Premium Plan params from URLSearchParams", () => {
  const params = new URLSearchParams({
    key: "foo",
    client_id: "gme-example",
    client_secret: "DUMMY_SIGNING_SECRET",
  });
  geolocate(
    {
      params: params as unknown as GeolocateRequest["params"],
      data: { considerIp: false },
    },
    mockedAxios
  );

  expect(mockedAxios).toHaveBeenCalledWith({
    method: "post",
    params: new URLSearchParams({ key: "foo" }),
    data: { considerIp: false },
    url: defaultUrl,
  });
  expect(params.toString()).toBe(
    "key=foo&client_id=gme-example&client_secret=DUMMY_SIGNING_SECRET"
  );
});

test("geolocate should not change the caller's params", () => {
  const params = {
    key: "foo",
    client_id: "gme-example",
    client_secret: "DUMMY_SIGNING_SECRET",
  };
  geolocate({ params, data: {} }, mockedAxios);

  expect(params).toEqual({
    key: "foo",
    client_id: "gme-example",
    client_secret: "DUMMY_SIGNING_SECRET",
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
