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
import { AddressDescriptor, ExtraComputation } from "../common";
import {
  ReverseGeocodeRequest,
  reverseGeocode,
  defaultParamsSerializer,
  defaultUrl,
} from "./reversegeocode";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

type Landmark = AddressDescriptor["landmarks"][number];

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

test("serializer should leave out enable_address_descriptor when false", () => {
  expect(
    defaultParamsSerializer({
      latlng: { lat: 28.640964, lng: 77.235875 },
      enable_address_descriptor: false,
      key: "YOUR_API_KEY",
    })
  ).toBe("key=YOUR_API_KEY&latlng=28.640964%2C77.235875");
});

test("serializer should leave out enable_address_descriptor when false for premium plan requests", () => {
  expect(
    defaultParamsSerializer({
      latlng: { lat: 28.640964, lng: 77.235875 },
      enable_address_descriptor: false,
      client_id: "testClient",
      client_secret: "testClientSecret",
    })
  ).toBe(
    "client=testClient&latlng=28.640964%2C77.235875&signature=tTA435oViZ_IoVjWyGRyOSObhhI="
  );
});

test("reverseGeocode response should type the address descriptor with the API's field names", async () => {
  // Trimmed from the response example in the address descriptors guide.
  jest.mocked(axios).mockResolvedValueOnce({
    data: {
      status: "OK",
      results: [],
      address_descriptor: {
        areas: [
          {
            containment: "OUTSKIRTS",
            display_name: { language_code: "en", text: "Turkman Gate" },
            place_id: "ChIJ_7LLvyb9DDkRMKKxP9YyXgs",
          },
        ],
        landmarks: [
          {
            display_name: { language_code: "en", text: "Delite Cinema" },
            straight_line_distance_meters: 29.9306755065918,
            place_id: "ChIJLfiYDCT9DDkROoEa7NdupUM",
            travel_distance_meters: 418.7794799804688,
            spatial_relationship: "ACROSS_THE_ROAD",
            types: ["establishment", "movie_theater", "point_of_interest"],
          },
        ],
      },
    },
  });

  const { address_descriptor } = (
    await reverseGeocode(
      { params: { latlng: "28.640964,77.235875", key: "foo" } },
      mockedAxios
    )
  ).data;
  const [landmark] = address_descriptor.landmarks;
  const [area] = address_descriptor.areas;

  expect(landmark.place_id).toBe("ChIJLfiYDCT9DDkROoEa7NdupUM");
  expect(landmark.display_name.text).toBe("Delite Cinema");
  expect(landmark.display_name.language_code).toBe("en");
  expect(landmark.types).toEqual([
    "establishment",
    "movie_theater",
    "point_of_interest",
  ]);
  expect(landmark.spatial_relationship).toBe("ACROSS_THE_ROAD");
  expect(landmark.straight_line_distance_meters).toBe(29.9306755065918);
  expect(landmark.travel_distance_meters).toBe(418.7794799804688);
  expect(area.place_id).toBe("ChIJ_7LLvyb9DDkRMKKxP9YyXgs");
  expect(area.display_name.text).toBe("Turkman Gate");
  expect(area.display_name.language_code).toBe("en");
  expect(area.containment).toBe("OUTSKIRTS");
  // @ts-expect-error The API returns place_id, not placeId.
  expect(landmark.placeId).toBeUndefined();
});

test("address descriptor landmarks should allow travel_distance_meters to be left out", () => {
  // The API leaves it out when the landmark can't be reached on the road
  // network near the target.
  const landmark: Landmark = {
    place_id: "ChIJLfiYDCT9DDkROoEa7NdupUM",
    display_name: { language_code: "en", text: "Delite Cinema" },
    types: ["establishment", "movie_theater", "point_of_interest"],
    spatial_relationship: "ACROSS_THE_ROAD" as Landmark["spatial_relationship"],
    straight_line_distance_meters: 29.9306755065918,
  };

  expect(landmark.travel_distance_meters).toBeUndefined();
});
