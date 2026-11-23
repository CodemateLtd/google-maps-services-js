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
  GeocodeRequest,
  geocode,
  defaultParamsSerializer,
  defaultUrl,
} from "./geocode";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

afterEach(() => {
  jest.clearAllMocks();
});

test("geocode should call axios correctly", () => {
  const params = { address: "Seattle", key: "foo", components: "country:us" };

  geocode({ params: params }, mockedAxios);

  expect(mockedAxios).toHaveBeenCalledTimes(1);
  expect(mockedAxios).toHaveBeenCalledWith({
    method: "get",
    params: params,
    paramsSerializer: defaultParamsSerializer,
    url: defaultUrl,
  });
});

test("serializer should send extra_computations with an address as in the address descriptors guide", () => {
  const params: GeocodeRequest["params"] = {
    address: "4118, Kalan Mehal Chandni Chowk, New Delhi",
    extra_computations: ExtraComputation.ADDRESS_DESCRIPTORS,
    key: "YOUR_API_KEY",
  };

  expect(defaultParamsSerializer(params)).toBe(
    "address=4118%2C%20Kalan%20Mehal%20Chandni%20Chowk%2C%20New%20Delhi&extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY"
  );
});

test("serializer should send extra_computations with a place ID as in the address descriptors guide", () => {
  const params: GeocodeRequest["params"] = {
    place_id: "ChIJyxAX8Bj9DDkRgBfAnBYa66Q",
    extra_computations: ExtraComputation.ADDRESS_DESCRIPTORS,
    key: "YOUR_API_KEY",
  };

  expect(defaultParamsSerializer(params)).toBe(
    "extra_computations=ADDRESS_DESCRIPTORS&key=YOUR_API_KEY&place_id=ChIJyxAX8Bj9DDkRgBfAnBYa66Q"
  );
});

test("serializer should omit extra_computations when not set", () => {
  expect(
    defaultParamsSerializer({
      address: "4118, Kalan Mehal Chandni Chowk, New Delhi",
      key: "YOUR_API_KEY",
    })
  ).toBe(
    "address=4118%2C%20Kalan%20Mehal%20Chandni%20Chowk%2C%20New%20Delhi&key=YOUR_API_KEY"
  );
});
