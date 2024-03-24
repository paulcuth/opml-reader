import sanitiseHtml from "../app/browser/sanitiseHtml.mjs";
import initDOMGlobals from "jsdom-global";

initDOMGlobals();
global.document = window.document;
global.URL = window.URL;

describe("sanitiseHtml", () => {
  it("removes external script tags", () => {
    const result = sanitiseHtml(
      '<moo>Moo<script src="external://url"></script></moo>',
      "base://url"
    );
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo>Moo</moo>'
    );
  });

  it("removes inline script tags", () => {
    const result = sanitiseHtml(
      "<moo>Moo<script>alert(1);</script></moo>",
      "base://url"
    );
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo>Moo</moo>'
    );
  });

  it("removes meta tags", () => {
    const result = sanitiseHtml("<moo>Moo<meta /></moo>", "base://url");
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo>Moo</moo>'
    );
  });

  it("removes style tags", () => {
    const result = sanitiseHtml(
      "<moo>Moo<style>body { color: white; }</style></moo>",
      "base://url"
    );
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo>Moo</moo>'
    );
  });

  it("removes template tags", () => {
    const result = sanitiseHtml(
      "<moo>Moo<template><p>hello</p></templata></moo>",
      "base://url"
    );
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo>Moo</moo>'
    );
  });

  it("removes slot tags", () => {
    const result = sanitiseHtml("<moo>Moo<slot /></moo>", "base://url");
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo>Moo</moo>'
    );
  });

  it("removes lower case event handlers", () => {
    const result = sanitiseHtml(
      '<moo><a href="./moo" onclick="alert(1)">Moo</a></moo>',
      "base://url"
    );
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo><a href="./moo">Moo</a></moo>'
    );
  });

  it("removes camel case event handlers", () => {
    const result = sanitiseHtml(
      '<moo><a href="./moo" onClick="alert(1)">Moo</a></moo>',
      "base://url"
    );
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo><a href="./moo">Moo</a></moo>'
    );
  });

  it("removes data attributes", () => {
    const result = sanitiseHtml(
      '<moo><a href="./moo" data-moo="moo">Moo</a></moo>',
      "base://url"
    );
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo><a href="./moo">Moo</a></moo>'
    );
  });

  it("removes slot attributes", () => {
    const result = sanitiseHtml(
      '<moo><a href="./moo" slot="moo">Moo</a></moo>',
      "base://url"
    );
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo><a href="./moo">Moo</a></moo>'
    );
  });

  it("removes links using javasctript protocol", () => {
    const result = sanitiseHtml(
      '<moo><a href="javascript:alert(1)">Moo</a></moo>',
      "base://url"
    );
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo><a>Moo</a></moo>'
    );
  });

  it("removes forms using javasctript protocol", () => {
    const result = sanitiseHtml(
      '<moo><form action="javascript:alert(1)"><button>Moo</button></form></moo>',
      "base://url"
    );
    expect(result).toEqual(
      '<base href="base://url" target="_blank"><moo><form><button>Moo</button></form></moo>'
    );
  });

  it("removes area maps using javasctript protocol", () => {
    const result = sanitiseHtml(
      `<moo>
          <map name="my-map">
          <area
            shape="poly"
            coords="100,0,200"
            href="javascript:alert(1)"
          />
        </map>
        <img usemap="#my-map" src="/my-map.png" />
      </moo>`,
      "base://url"
    );
    expect(result).toEqual(
      `<base href="base://url" target="_blank"><moo>
          <map name="my-map">
          <area shape="poly" coords="100,0,200">
        </map>
        <img usemap="#my-map" src="/my-map.png">
      </moo>`
    );
  });
});
