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
import { ExtraComputation, GeocodeResult } from "../common";
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

test("geocode response should type an address descriptor on each result that has one", async () => {
  // Trimmed from the response example in the address descriptors guide; the
  // second result, the Chandni Chowk area, stands for one that gets none.
  jest.mocked(axios).mockResolvedValueOnce({
    data: {
      status: "OK",
      results: [
        {
          place_id: "ChIJyxAX8Bj9DDkRgBfAnBYa66Q",
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
        { place_id: "ChIJWcXciBr9DDkRUb4dCDykTwI" },
      ],
    },
  });

  const { results } = (
    await geocode(
      {
        params: {
          address: "4118, Kalan Mehal Chandni Chowk, New Delhi",
          extra_computations: ExtraComputation.ADDRESS_DESCRIPTORS,
          key: "foo",
        },
      },
      mockedAxios
    )
  ).data;
  const [landmark] = results[0].address_descriptor.landmarks;
  const [area] = results[0].address_descriptor.areas;

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
  expect(area.containment).toBe("OUTSKIRTS");
  expect(results[1].address_descriptor).toBeUndefined();
});

test("geocode results should allow address_descriptor to be left out", () => {
  const result: Pick<GeocodeResult, "place_id" | "address_descriptor"> = {
    place_id: "ChIJWcXciBr9DDkRUb4dCDykTwI",
  };

  expect(result.address_descriptor).toBeUndefined();
});
