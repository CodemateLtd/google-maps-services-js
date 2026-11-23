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

import nock from "nock";

import { AxiosResponse } from "axios";
import { Client } from "./client";
import { Status } from "./common";
import { statusToCode } from "./adapter";

beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

test("httpadapter rejects Status.NOT_FOUND", async () => {
  nock("https://maps.googleapis.com")
    .get(
      "/maps/api/place/details/json?fields=place_id,name&key=foo&place_id=notarealid"
    )
    .reply(200, JSON.stringify({ status: Status.NOT_FOUND }), {
      "Content-Type": "application/json",
    });

  const client = new Client();

  const params = {
    place_id: "notarealid",
    key: "foo",
    fields: ["place_id", "name"],
  };

  await expect(client.placeDetails({ params: params })).rejects.toEqual(
    Error("Request failed with status code 404")
  );
});

test("httpadapter resolves Status.OK", async () => {
  const response = { status: Status.OK };

  nock("https://maps.googleapis.com")
    .get(
      "/maps/api/place/details/json?fields=place_id,name&key=foo&place_id=notarealid"
    )
    .reply(200, JSON.stringify(response), {
      "Content-Type": "application/json",
    });

  const client = new Client();

  const params = {
    place_id: "notarealid",
    key: "foo",
    fields: ["place_id", "name"],
  };

  const r: AxiosResponse = await client.placeDetails({ params: params });
  expect(r.data).toEqual(response);
});

test("httpadapter rejects Status.DATA_NOT_AVAILABLE", async () => {
  const response = { status: Status.DATA_NOT_AVAILABLE, results: [] };

  nock("https://maps.googleapis.com")
    .get("/maps/api/elevation/json?key=foo&locations=10%2C20")
    .reply(200, JSON.stringify(response), {
      "Content-Type": "application/json",
    });

  const client = new Client();

  const params = {
    locations: ["10,20"],
    key: "foo",
  };

  await expect(client.elevation({ params: params })).rejects.toMatchObject({
    message: "Request failed with status code 404",
    response: { status: 404, data: response },
  });
});

test("httpadapter respects validateStatus for Status.DATA_NOT_AVAILABLE", async () => {
  const response = { status: Status.DATA_NOT_AVAILABLE, results: [] };

  nock("https://maps.googleapis.com")
    .get("/maps/api/elevation/json?key=foo&locations=10%2C20")
    .reply(200, JSON.stringify(response), {
      "Content-Type": "application/json",
    });

  const client = new Client();

  const params = {
    locations: ["10,20"],
    key: "foo",
  };

  const r: AxiosResponse = await client.elevation({
    params: params,
    validateStatus: () => true,
  });
  expect(r.status).toEqual(404);
  expect(r.data).toEqual(response);
});

test("statusToCode returns correct value", () => {
  expect(statusToCode(Status.OK)).toEqual(200);
  expect(statusToCode(Status.ZERO_RESULTS)).toEqual(200);
  expect(statusToCode(Status.INVALID_REQUEST)).toEqual(400);
  expect(statusToCode(Status.MAX_ROUTE_LENGTH_EXCEEDED)).toEqual(400);
  expect(statusToCode(Status.MAX_WAYPOINTS_EXCEEDED)).toEqual(400);
  expect(statusToCode(Status.REQUEST_DENIED)).toEqual(403);
  expect(statusToCode(Status.NOT_FOUND)).toEqual(404);
  expect(statusToCode(Status.DATA_NOT_AVAILABLE)).toEqual(404);
  expect(statusToCode(Status.OVER_DAILY_LIMIT)).toEqual(429);
  expect(statusToCode(Status.OVER_QUERY_LIMIT)).toEqual(429);
  expect(statusToCode(Status.UNKNOWN_ERROR)).toEqual(500);
  expect(statusToCode("foo" as Status)).toEqual(200);
});
