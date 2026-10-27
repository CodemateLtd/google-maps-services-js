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
import { ExtraComputation } from "../common";
import {
  ReverseGeocodeRequest,
  reverseGeocode,
  defaultParamsSerializer,
  defaultUrl,
} from "./reversegeocode";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
  jest.clearAllMocks();
});

test("reverseGeocode should call axios correctly", () => {
  const params = {
    latlng: {
      lat: 60.168997,
      lng: 24.9433353,
    },
    key: "foo",
    extra_computations: ExtraComputation.ADDRESS_DESCRIPTORS,
  };

  reverseGeocode({ params: params }, mockedAxios);

  expect(mockedAxios).toHaveBeenCalledTimes(1);
  expect(mockedAxios).toHaveBeenCalledWith({
    method: "get",
    params: params,
    paramsSerializer: defaultParamsSerializer,
    url: defaultUrl,
  });
});

test("serializer should send extra_computations as in the address descriptors guide", () => {
  const params: ReverseGeocodeRequest["params"] = {
    latlng: "28.640964,77.235875",
    extra_computations: ExtraComputation.ADDRESS_DESCRIPTORS,
    key: "YOUR_API_KEY",
  };

  expect(defaultParamsSerializer(params)).toBe(
    "extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY&latlng=28.640964%2C77.235875"
  );
});

test("serializer should omit extra_computations when not set", () => {
  expect(
    defaultParamsSerializer({
      latlng: { lat: 28.640964, lng: 77.235875 },
      key: "YOUR_API_KEY",
    })
  ).toBe("key=YOUR_API_KEY&latlng=28.640964%2C77.235875");
});

test("serializer should sign extra_computations for premium plan requests", () => {
  expect(
    defaultParamsSerializer({
      latlng: { lat: 28.640964, lng: 77.235875 },
      extra_computations: ExtraComputation.ADDRESS_DESCRIPTORS,
      client_id: "testClient",
      client_secret: "testClientSecret",
    })
  ).toBe(
    "client=testClient&extra_computations=ADDRESS_DESCRIPTORS&latlng=28.640964%2C77.235875&signature=MUzvtzsXeekuOk-t8MO8Gh9qrwU="
  );
});

test("serializer should keep sending the deprecated enable_address_descriptor", () => {
  expect(
    defaultParamsSerializer({
      latlng: { lat: 28.640964, lng: 77.235875 },
      enable_address_descriptor: true,
      key: "YOUR_API_KEY",
    })
  ).toBe(
    "enable_address_descriptor=True&key=YOUR_API_KEY&latlng=28.640964%2C77.235875"
  );
});
