export default function sanitiseHtml(html, sourceUrl) {
  const div = document.createElement("div");
  div.innerHTML = html ?? "(Article has no content)";

  // Remove script, meta, style, template & slot tags
  [...div.querySelectorAll("script, meta, style, template, slot")].forEach(
    (el) => el.remove()
  );

  // Remove event handlers, data attributes & slots
  [...(div.querySelectorAll("*") ?? [])].forEach((el) => {
    const attrs = el.getAttributeNames();
    const attrsToRemove = attrs.filter(
      (name) =>
        name.startsWith("on") || name.startsWith("data-") || name === "slot"
    );
    attrsToRemove.forEach((name) => el.removeAttribute(name));
  });

  // Remove link and area map hrefs with javascript protocol
  [...div.querySelectorAll("a[href],area[href]")].forEach((a) => {
    try {
      const url = new URL(a.getAttribute("href"), sourceUrl);
      if (url.protocol.toLowerCase() !== "javascript:") {
        return;
      }
    } catch (e) {}
    a.removeAttribute("href");
  });

  // Remove form actions with javascript protocol
  [...div.querySelectorAll("form[action]")].forEach((form) => {
    try {
      const url = new URL(form.getAttribute("action"), sourceUrl);
      if (url.protocol.toLowerCase() !== "javascript:") {
        return;
      }
    } catch (e) {}
    form.removeAttribute("action");
  });

  // Change base of images and links
  return `<base href="${sourceUrl}" target="_blank">${div.innerHTML}`;
}
