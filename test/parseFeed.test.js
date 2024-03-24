import parseFeed from "../app/browser/parseFeed.mjs";
import initDOMGlobals from "jsdom-global";

initDOMGlobals();
global.DOMParser = window.DOMParser;

describe("parseFeed", () => {
  it("returns error with unknown feed type", () => {
    const result = parseFeed("<moo></moo>");
    expect(result.parseError).toBeDefined();
  });

  it("parses an RSS feed", () => {
    const content = `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Feed title</title>
    <description>Feed description</description>
    <link>https://feed/link</link>
    <lastBuildDate>Mon, 08 Apr 2024 10:00:00 +0100</lastBuildDate>
    <image>
      <url>https://feed/avatar</url>
      <width>32</width>
      <height>32</height>
    </image> 
    <item>
      <title>Article title</title>
      <description>
        <![CDATA[<h1>Article content</h1>]]>
      </description>
      <pubDate>Mon, 08 Apr 2024 10:00:01 +0100</pubDate>
      <link>https://article/link</link>
      <guid>https://article/id</guid>
    </item>
  </channel>
</rss>`;

    const result = parseFeed(content);
    expect(result.title).toEqual("Feed title");
    expect(result.description).toEqual("Feed description");
    expect(result.linkUrl).toEqual("https://feed/link");
    expect(result.updated).toEqual("Mon, 08 Apr 2024 10:00:00 +0100");
    expect(result.avatarUrl).toEqual("https://feed/avatar");
    expect(result.articles).toHaveLength(1);

    const article = result.articles[0];
    expect(article.id).toEqual("https://article/id");
    expect(article.title).toEqual("Article title");
    expect(article.linkUrl).toEqual("https://article/link");
    expect(article.updated).toEqual("Mon, 08 Apr 2024 10:00:01 +0100");
    expect(article.html.trim()).toEqual("<h1>Article content</h1>");
  });

  it("parses an Atom feed", () => {
    const content = `<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Feed title</title>
  <subtitle>Feed description</subtitle>
  <link href="https://feed/link"/>
  <updated>2024-03-21T00:00:00Z</updated>
  <entry>
    <title>Article title</title>
    <link href="https://article/link"/>
    <updated>2024-03-21T00:00:01Z</updated>
    <id>https://article/id</id>
    <content type="html"><h1>Article content</h1></content>
  </entry>
</feed>`;

    const result = parseFeed(content);
    expect(result.title).toEqual("Feed title");
    expect(result.description).toEqual("Feed description");
    expect(result.linkUrl).toEqual("https://feed/link");
    expect(result.updated).toEqual("2024-03-21T00:00:00Z");
    expect(result.avatarUrl).toBeNull();
    expect(result.articles).toHaveLength(1);

    const article = result.articles[0];
    expect(article.id).toEqual("https://article/id");
    expect(article.title).toEqual("Article title");
    expect(article.linkUrl).toEqual("https://article/link");
    expect(article.updated).toEqual("2024-03-21T00:00:01Z");
    expect(article.html.trim()).toEqual(
      `<h1 xmlns="http://www.w3.org/2005/Atom">Article content</h1>`
    );
  });

  it("doesn't use self links in an Atom feed", () => {
    const content = `<feed xmlns="http://www.w3.org/2005/Atom">
  <link href="https://feed/link/self" rel="self" />
  <link href="https://feed/link"/>
</feed>`;

    const result = parseFeed(content);
    expect(result.linkUrl).toEqual("https://feed/link");
  });

  it("parses a YouTube Atom feed", () => {
    /*
      Note: JSDOM doesn't work with namespaced tag names, so the `media:` 
      prefixes have been removed from the sample feed below.
    */
    const content = `<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
  <link rel="self" href="http://www.youtube.com/feeds/videos.xml?channel_id=UCD_channelId"/>
  <id>yt:channel:D_channelId</id>
  <yt:channelId>D_channelId</yt:channelId>
  <title>Channel title</title>
  <link rel="alternate" href="https://www.youtube.com/channel/UCD_channelId"/>
  <author>
    <name>Channel author</name>
    <uri>https://www.youtube.com/channel/UCD_channelId</uri>
  </author>
  <published>2006-06-21T10:10:32+00:00</published>
  <entry>
    <id>yt:video:video-id</id>
    <yt:videoId>video-id</yt:videoId>
    <yt:channelId>UCD_channelId</yt:channelId>
    <title>Video title</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=video-id"/>
    <author>
      <name>Video author</name>
      <uri>https://www.youtube.com/channel/UCD_channelId</uri>
    </author>
    <published>2023-06-22T16:30:10+00:00</published>
    <updated>2024-03-23T11:02:53+00:00</updated>
    <group>
      <title>Media title</title>
      <content url="https://www.youtube.com/v/video-id?version=3" type="application/x-shockwave-flash" width="640" height="390"/>
      <thumbnail url="https://i2.ytimg.com/vi/video-id/hqdefault.jpg" width="480" height="360"/>
      <description>Media description</description>
      <community>
        <starRating count="137" average="5.00" min="1" max="5"/>
        <statistics views="3189"/>
      </community>
    </group>
  </entry>
</feed>`;

    const result = parseFeed(content);
    expect(result.title).toEqual("Channel title");
    expect(result.description).toEqual("");
    expect(result.linkUrl).toEqual(
      "https://www.youtube.com/channel/UCD_channelId"
    );
    expect(result.avatarUrl).toBeNull();
    expect(result.articles).toHaveLength(1);

    const article = result.articles[0];
    expect(article.id).toEqual("yt:video:video-id");
    expect(article.title).toEqual("Video title");
    expect(article.linkUrl).toEqual("https://www.youtube.com/watch?v=video-id");
    expect(article.updated).toEqual("2024-03-23T11:02:53+00:00");
    expect(article.html.trim()).toEqual(`<section>
      <header>Media title</header>
      <figure>
        <img src="https://i2.ytimg.com/vi/video-id/hqdefault.jpg" /><p><a href="https://www.youtube.com/v/video-id?version=3">Open media</a></p>
        <figcaption>Media description</figcaption>
      </figure>
    </section>`);
  });

  it("parses a Bluesky RSS feed", () => {
    const content = `<rss version="2.0">
  <channel>
    <description>Profile summary</description>
    <link>https://bsky.app/profile/username.bsky.social</link>
    <title>@username.bsky.social - Profile name</title>
    <item>
      <link>https://bsky.app/profile/username.bsky.social/post/postid</link>
      <description>Post content [contains quote post or other embedded content]</description>
      <pubDate>08 Apr 24 19:00 +0000</pubDate>
      <guid isPermaLink="false">at://did:plc:wtfisthis/app.bsky.feed.post/postid</guid>
    </item>
  </channel>
</rss>`;

    const result = parseFeed(content);
    expect(result.title).toEqual("@username.bsky.social - Profile name");
    expect(result.description).toEqual("Profile summary");
    expect(result.linkUrl).toEqual(
      "https://bsky.app/profile/username.bsky.social"
    );
    expect(result.avatarUrl).toBeNull();
    expect(result.articles).toHaveLength(1);

    const article = result.articles[0];
    expect(article.id).toEqual(
      "at://did:plc:wtfisthis/app.bsky.feed.post/postid"
    );
    expect(article.title).toEqual("Untitled article");
    expect(article.linkUrl).toEqual(
      "https://bsky.app/profile/username.bsky.social/post/postid"
    );
    expect(article.updated).toEqual("08 Apr 24 19:00 +0000");
    expect(article.html.trim()).toEqual(
      `Post content [contains quote post or other embedded content]`
    );
  });
});
