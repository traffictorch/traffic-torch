// js/apis/trends.js
export async function getGoogleTrendsInterest(keyword) {
  const exploreUrl = "https://trends.google.com/trends/api/explore";
  const req = {
    comparisonItem: [{ keyword, geo: "", time: "today 5-y" }],
    category: 0,
    property: ""
  };

  const url = `https://cors-proxy.traffictorch.workers.dev/?${encodeURIComponent(
    `${exploreUrl}?hl=en-US&tz=-120&req=${encodeURIComponent(JSON.stringify(req))}`
  )}`;

  const response = await fetch(url);
  const text = await response.text();
  const json = JSON.parse(text.replace(")]}',\n", ""));

  const widget = json.widgets?.find(w => w.request?.comparisonItem);
  if (!widget) return { trend: "unknown" };

  const token = widget.token;
  const embedReq = widget.request;
  embedReq.time = "today 5-y";

  const interestUrl = `https://cors-proxy.traffictorch.workers.dev/?${encodeURIComponent(
    `https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=-120&req=${encodeURIComponent(JSON.stringify(embedReq))}&token=${token}`
  )}`;

  const interestRes = await fetch(interestUrl);
  const interestText = await interestRes.text();
  const interestJson = JSON.parse(interestText.replace(")]}',\n", ""));

  const values = interestJson.default.timelineData.map(d => d.value[0]);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const recent = values.slice(-6).reduce((a, b) => a + b, 0) / 6;

  let trend = "stable";
  if (recent > avg * 1.3) trend = "rising";
  if (recent < avg * 0.7) trend = "falling";

  return { trend, average: Math.round(avg), recent: Math.round(recent) };
}