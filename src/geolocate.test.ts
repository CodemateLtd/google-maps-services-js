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
import { RadioType } from "./common";
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

test("GeolocateRequest should accept NR and LTE cell towers", () => {
  const nr: GeolocateRequest["data"] = {
    radioType: RadioType.nr,
    cellTowers: [
      {
        newRadioCellId: 68719476735,
        mobileCountryCode: 310,
        mobileNetworkCode: 410,
        age: 0,
        signalStrength: -60,
      },
    ],
  };
  const lte: GeolocateRequest["data"] = {
    radioType: RadioType.lte,
    cellTowers: [
      {
        cellId: 170402199,
        locationAreaCode: 35632,
        mobileCountryCode: 310,
        mobileNetworkCode: 410,
        age: 0,
        signalStrength: -60,
        timingAdvance: 15,
      },
    ],
  };

  expect(nr.radioType).toBe("nr");
  expect(lte.radioType).toBe("lte");
});

test("GeolocateRequest should reject invalid cell towers", () => {
  const towers: GeolocateRequest["data"]["cellTowers"] = [
    // @ts-expect-error An NR tower needs newRadioCellId.
    { mobileCountryCode: 310, mobileNetworkCode: 410 },
    // @ts-expect-error A tower has either cellId or newRadioCellId.
    {
      cellId: 170402199,
      newRadioCellId: 68719476735,
      locationAreaCode: 35632,
      mobileCountryCode: 310,
      mobileNetworkCode: 410,
    },
  ];

  expect(towers).toHaveLength(2);
});
