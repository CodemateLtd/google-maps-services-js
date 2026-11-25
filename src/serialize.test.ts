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

import { LatLng, LatLngLiteral } from "./common";
import {
  createPremiumPlanQueryString,
  latLngArrayToStringMaybeEncoded,
  latLngBoundsToString,
  latLngToString,
  objectToString,
  serializer,
  toLatLngLiteral,
  toTimestamp,
} from "./serialize";

test("latLngToString is correct", () => {
  expect(latLngToString("")).toBe("");
  expect(latLngToString("10,20")).toBe("10,20");
  expect(latLngToString([10, 20])).toBe("10,20");
  expect(latLngToString({ lat: 10, lng: 20 })).toBe("10,20");
  expect(latLngToString({ latitude: 10, longitude: 20 })).toBe("10,20");
  expect(() => {
    latLngToString({} as LatLngLiteral);
  }).toThrow(TypeError);
});

test("latLngBoundsToString is correct", () => {
  expect(latLngBoundsToString("")).toBe("");
  expect(
    latLngBoundsToString({
      southwest: { lat: 1, lng: 2 },
      northeast: { lat: 3, lng: 4 },
    })
  ).toBe("1,2|3,4");
});

test("serializer", () => {
  expect(
    serializer({ quz: (o) => o }, "http://mock.url")({ foo: ["bar"] })
  ).toBe("foo=bar");
  expect(
    serializer(
      {
        foo: (o) => o.map((latLng: LatLng) => latLngToString(latLng)),
      },
      "http://mock.url"
    )({
      foo: [
        [0, 1],
        [2, 3],
      ],
    })
  ).toBe("foo=0%2C1|2%2C3");
});

test("serializer should not mutate params", () => {
  const location = { lat: 0, lng: 1 };
  const params = {
    location,
  };

  serializer({ location: latLngToString }, "http://mock.url")(params);
  expect(params.location).toBe(location);
});

test("serializer should return pipe joined arrays by default", () => {
  expect(serializer({}, "http://mock.url")({ foo: ["b", "a", "r"] })).toBe(
    "foo=b|a|r"
  );
});

test("serializer strictly encodes keys and values", () => {
  expect(
    serializer(
      {},
      "http://mock.url"
    )({
      query: "Joe's (pizza)!*",
      name: "Café & bar = ok",
      fields: "name|geometry,place_id",
      emoji: "😀",
      tilde: "a~b-c_d.e",
    })
  ).toBe(
    "emoji=%F0%9F%98%80&fields=name%7Cgeometry%2Cplace_id&name=Caf%C3%A9%20%26%20bar%20%3D%20ok&query=Joe%27s%20%28pizza%29%21%2A&tilde=a~b-c_d.e"
  );
});

test("serializer handles null, undefined and empty values", () => {
  expect(
    serializer({}, "http://mock.url")({ a: null, b: undefined, c: "" })
  ).toBe("a&c=");
  expect(
    serializer(
      {},
      "http://mock.url"
    )({
      empty: [],
      undef: [undefined],
      mixed: ["a", null, undefined, "b c|d"],
      nul: [null],
    })
  ).toBe("mixed=a||b%20c%7Cd&nul=");
});

test("serializer converts numbers, booleans and dates to strings", () => {
  expect(
    serializer({}, "http://mock.url")({ n: 1.5, z: 0, t: true, f: false })
  ).toBe("f=false&n=1.5&t=true&z=0");

  // Date#toString depends on the local time zone, so build the expectation
  // from it and check the strict encoding of its parentheses.
  const d = new Date(0);
  expect(serializer({}, "http://mock.url")({ d })).toBe(
    "d=" + encodeURIComponent(String(d)).replace("(", "%28").replace(")", "%29")
  );
});

test("serializer sorts by key, not by key=value", () => {
  expect(serializer({}, "http://mock.url")({ "a-b": 1, a: 2, B: 3 })).toBe(
    "B=3&a=2&a-b=1"
  );
});

test("serializer joins arrays with commas for the comma format", () => {
  expect(
    serializer({}, "http://mock.url", { arrayFormat: "comma" })({
      fields: ["name", "geometry"],
      x: ["a,b"],
      y: [],
    })
  ).toBe("fields=name,geometry&x=a%2Cb");
});

test("serializer rejects query string options it does not implement", () => {
  const params = { foo: ["a", "b"] };

  expect(() => serializer({}, "http://mock.url", {})(params)).toThrow(
    TypeError
  );
  for (const arrayFormat of ["none", "bracket"]) {
    expect(() =>
      serializer({}, "http://mock.url", { arrayFormat })(params)
    ).toThrow(TypeError);
  }
  expect(() =>
    serializer({}, "http://mock.url", {
      arrayFormat: "separator",
      arrayFormatSeparator: "||",
    })(params)
  ).toThrow(TypeError);

  for (const option of [
    "encode",
    "strict",
    "sort",
    "skipNull",
    "skipEmptyString",
  ]) {
    expect(() =>
      serializer({}, "http://mock.url", {
        arrayFormat: "comma",
        [option]: false,
      })(params)
    ).toThrow(TypeError);
  }
});

test("serializer creates premium plan query string if premium plan params are included", () => {
  const params = {
    avoid: "ferries",
    destination: {
      lat: "38.8977",
      lng: "-77.0365",
    },
    mode: "driving",
    origin: {
      lat: "33.8121",
      lng: "-117.9190",
    },
    units: "imperial",
    client_id: "testClient",
    client_secret: "testClientSecret",
  };

  expect(
    serializer(
      {
        origin: latLngToString,
        destination: latLngToString,
      },
      "https://test.url/maps/api/directions/json"
    )(params)
  ).toEqual(
    "avoid=ferries&client=testClient&destination=38.8977%2C-77.0365&mode=driving&origin=33.8121%2C-117.9190&units=imperial&signature=YRJoTd6ohbpsR14WkWv3S7H6MqU="
  );
});

test("objectToString", () => {
  expect(objectToString("foo")).toBe("foo");
  expect(objectToString({ c: "c", a: "a", b: "b" })).toBe("a:a|b:b|c:c");
});

test("latLngArrayToStringMaybeEncoded", () => {
  expect(latLngArrayToStringMaybeEncoded("0,0")).toEqual("0,0");
  expect(latLngArrayToStringMaybeEncoded([[0, 0]])).toEqual("0,0");
  expect(
    latLngArrayToStringMaybeEncoded([
      [40.714728, -73.998672],
      [-34.397, 150.644],
    ])
  ).toEqual("enc:abowFtzsbMhgmiMuobzi@");
});

test("toLatLngLiteral", () => {
  expect(toLatLngLiteral("0,1")).toEqual({ lat: 0, lng: 1 });
  expect(toLatLngLiteral([0, 1])).toEqual({ lat: 0, lng: 1 });
  expect(toLatLngLiteral({ lat: 0, lng: 1 })).toEqual({
    lat: 0,
    lng: 1,
  });
  expect(toLatLngLiteral({ latitude: 0, longitude: 1 })).toEqual({
    lat: 0,
    lng: 1,
  });
  expect(() => {
    toLatLngLiteral({} as LatLngLiteral);
  }).toThrow(TypeError);
});

test("toTimestamp", () => {
  expect(toTimestamp(100)).toEqual(100);

  const dt = new Date();
  const seconds = Math.round(Number(dt) / 1000);
  expect(toTimestamp(dt)).toEqual(seconds);
  expect(toTimestamp("now")).toEqual("now");

  expect(toTimestamp(new Date("2022-06-22T09:03:33.430Z"))).toEqual(1655888613);
});

test("createPremiumPlanQueryString", () => {
  const serializedParams = {
    avoid: "ferries",
    destination: "38.8977,-77.0365",
    mode: "driving",
    origin: "33.8121,-117.9190",
    units: "imperial",
    client_id: "testClient",
    client_secret: "testClientSecret",
  };
  const queryStringOptions = {
    arrayFormat: "separator",
    arrayFormatSeparator: "|",
  };
  const baseUrl = "https://test.url/maps/api/directions/json";

  expect(
    createPremiumPlanQueryString(serializedParams, queryStringOptions, baseUrl)
  ).toEqual(
    "avoid=ferries&client=testClient&destination=38.8977%2C-77.0365&mode=driving&origin=33.8121%2C-117.9190&units=imperial&signature=YRJoTd6ohbpsR14WkWv3S7H6MqU="
  );
});
