export default function parseFeed(xml, sourceUrl) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "application/xml");
  const rootNode = xmlDoc.documentElement;

  switch (rootNode.tagName) {
    case "feed":
      return parseFeedNode(rootNode, sourceUrl);
    case "rss":
      return parseRSSNode(rootNode, sourceUrl);
    default:
      return { parseError: `Unknown feed type (${rootNode.tagName})` };
  }
}

const textFromHtml = (html = "") => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent.trim();
};

const resolveUrl = (url, baseUrl) => {
  if (url == null) {
    return null;
  }
  try {
    return new URL(url, baseUrl).toString();
  } catch (e) {
    return url;
  }
};

/*******************************************************************************
  Atom
 ******************************************************************************/

function parseFeedNode(node, sourceUrl) {
  const result = {
    title:
      node
        .querySelector("title:not(entry title)")
        ?.textContent?.replaceAll("<", "&lt;") || "Untitled feed",
    description: node.querySelector("subtitle")?.textContent ?? "",
    linkUrl: resolveUrl(
      node
        .querySelector("link:not(entry link):not([rel=self])")
        ?.getAttribute("href")
    ),
    updated: node.querySelector("updated:not(entry updated)")?.textContent,
    avatarUrl: resolveUrl(node.querySelector("logo")?.textContent, sourceUrl),
    articles: [...node.querySelectorAll("entry")].map((e) =>
      parseFeedEntry(e, sourceUrl)
    ),
  };

  return result;
}

function parseFeedEntry(node, sourceUrl) {
  const result = {
    id: node.querySelector("id")?.textContent,
    title:
      node.querySelector("title")?.textContent?.replaceAll("<", "&lt;") ||
      "Untitled article",
    linkUrl: resolveUrl(
      node.querySelector("link")?.getAttribute("href"),
      sourceUrl
    ),
    updated: node.querySelector("updated")?.textContent,
  };

  const content = node.querySelector("content");
  result.html = parseContentNode(content);

  const mediaHtml = [...node.querySelectorAll("*|group")].map(parseMediaNode);
  result.html = `${result.html ?? ""}${mediaHtml.join("")}`;

  if (result.html == "") {
    result.html = node.querySelector("summary")?.textContent;
  }

  return result;
}

function parseContentNode(node) {
  const type = node?.getAttribute("type");
  if (type === "html" || type === "xhtml") {
    const isCData = node.firstElementChild == null;
    return isCData ? node.textContent : node.innerHTML;
  }
}

function parseMediaNode(node) {
  const title = node.querySelector("*|title")?.textContent;
  const description = node.querySelector("*|description")?.textContent;
  const contentNode = node.querySelector("*|content");
  const thumbnailNode = node.querySelector("*|thumbnail");
  const contentHtml = parseMediaContentNode(contentNode, thumbnailNode);

  return `
    <section>
      <header>${title}</header>
      <figure>
        ${contentHtml}
        <figcaption>${description}</figcaption>
      </figure>
    </section>
  `;
}

function parseMediaContentNode(node, thumbnail) {
  const url = node?.getAttribute("url");
  const type = node?.getAttribute("type");

  if (type.startsWith("image/") || type == null) {
    return `<img src="${url}" />`;
  }

  const thumbUrl = thumbnail?.getAttribute("url");
  if (thumbUrl != null) {
    return `<img src="${thumbUrl}" /><p><a href="${url}">Open media</a></p>`;
  }

  if (url) {
    return `<a href="${url}" type="${type}">Open media</a>`;
  }

  return `<p>(Unrecognised media)</p>`;
}

/*******************************************************************************
  RSS
 ******************************************************************************/

function parseRSSNode(node, sourceUrl) {
  const result = {
    title:
      node
        .querySelector("title:not(item title)")
        ?.textContent?.replaceAll("<", "&lt;") || "Untitled feed",
    description: textFromHtml(
      node.querySelector("description:not(item description)")?.textContent
    ),
    linkUrl: resolveUrl(
      node.querySelector("link:not(item link):not([rel=self])", sourceUrl)
        ?.textContent
    ),
    updated: node.querySelector("lastBuildDate")?.textContent,
    avatarUrl: resolveUrl(
      node.querySelector("image url")?.textContent,
      sourceUrl
    ),
    articles: [...node.querySelectorAll("item")].map((i) =>
      parseRSSItem(i, sourceUrl)
    ),
  };

  return result;
}

function parseRSSItem(node, sourceUrl) {
  const linkUrl = resolveUrl(
    node.querySelector("link")?.textContent ||
      node.querySelector("link")?.getAttribute("href"),
    sourceUrl
  );

  const result = {
    id:
      node.querySelector("guid")?.textContent ??
      linkUrl ??
      window.crypto.randomUUID(),
    title:
      node.querySelector("title")?.textContent?.replaceAll("<", "&lt;") ||
      "Untitled article",
    linkUrl,
    updated:
      node.querySelector("pubDate")?.textContent ||
      node.querySelector("published")?.textContent,
    html: node.querySelector("description")?.textContent,
  };

  if (result.html == null) {
    const content = node.querySelector("content");
    result.html = parseContentNode(content);
  }

  return result;
}
