import fetch from "node-fetch";

export async function get(request) {
  const url = request.query.url;

  try {
    const response = await fetch(url);
    const content = await response.text();

    return {
      json: {
        content,
      },
    };
  } catch (e) {
    return {
      json: {
        error: e.message,
      },
    };
  }
}
