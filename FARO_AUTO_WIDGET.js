// FARO · Widget Auto-Update · install ONCE in Scriptable
// Automatically downloads the latest reviewed FARO widget from your GitHub.
// The iPhone decides when widgets refresh: not real-time.
// Executing mutable remote code grants the selected GitHub repository the
// same Scriptable permissions as this script. Use only your trusted repo.

const FARO_RAW =
  "https://raw.githubusercontent.com/lukileke/zeeland-surf-check/main/zeeland-widget.js";
const FARO_HOME = "https://lukileke.github.io/zeeland-surf-check/";
const FARO_CACHE = "faro-auto-zeeland-last-good.txt";

const fm = FileManager.local();
const cachePath = fm.joinPath(fm.documentsDirectory(), FARO_CACHE);
const AsyncFunction = (async function () {}).constructor;

function acceptable(source) {
  return typeof source === "string" &&
    source.length > 20000 && source.length < 200000 &&
    source.includes("// FARO Widget") &&
    source.includes('const SITE="https://lukileke.github.io/zeeland-surf-check/"') &&
    source.includes("Script.setWidget(widget)") &&
    source.includes("Script.complete()");
}
function cachedSource() {
  try {
    if (!fm.fileExists(cachePath)) return null;
    const data = fm.readString(cachePath);
    return acceptable(data) ? data : null;
  } catch (error) {
    console.warn("FARO: cannot read widget cache: " + String(error));
    return null;
  }
}
async function fetchLatest() {
  const req = new Request(FARO_RAW + "?refresh=" + Date.now());
  req.timeoutInterval = 12;
  const source = await req.loadString();
  if (req.response && req.response.statusCode !== 200)
    throw new Error("GitHub HTTP " + req.response.statusCode);
  if (!acceptable(source))
    throw new Error("GitHub did not return the expected FARO widget");
  // Compile before replacing the last-known-good copy.
  new AsyncFunction(source);
  return source;
}
async function runSource(source) {
  // The full Scriptable widget runs in this async function. Its existing
  // args.widgetParameter, config.widgetFamily and Script.setWidget are intact.
  await new AsyncFunction(source)();
}
async function offlineWidget(error) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color("#103139");
  widget.setPadding(17, 17, 15, 17);
  const heading = widget.addText("FARO · SIN CONEXIÓN");
  heading.textColor = new Color("#FFDA71");
  heading.font = Font.boldSystemFont(13);
  widget.addSpacer(9);
  const message = widget.addText(
    "Abre Scriptable con internet una vez para descargar el widget."
  );
  message.textColor = Color.white();
  message.font = Font.mediumSystemFont(12);
  message.lineLimit = 3;
  widget.url = FARO_HOME;
  widget.refreshAfterDate = new Date(Date.now() + 20 * 60000);
  Script.setWidget(widget);
  console.warn("FARO auto-update: " + String(error));
  if (config.runsInApp) {
    if (config.widgetFamily === "small") await widget.presentSmall();
    else if (config.widgetFamily === "large") await widget.presentLarge();
    else await widget.presentMedium();
  }
  Script.complete();
}

// Every iOS refresh checks main. If GitHub is unavailable, use the last
// valid code. A bad newly fetched script cannot permanently destroy cache.
const previous = cachedSource();
let latest = null;
let retrievalError = null;
try {
  latest = await fetchLatest();
} catch (error) {
  retrievalError = error;
  console.warn("FARO GitHub unavailable; using cached widget: " + String(error));
}
if (latest && latest !== previous) {
  try { fm.writeString(cachePath, latest); }
  catch (error) { console.warn("FARO cache write failed: " + String(error)); }
}
try {
  if (!latest && !previous) {
    await offlineWidget(retrievalError || new Error("No cached widget yet"));
  } else {
    try {
      await runSource(latest || previous);
    } catch (error) {
      if (latest && previous && latest !== previous) {
        console.warn("FARO: new code failed; reverting to cached copy: " + String(error));
        try { fm.writeString(cachePath, previous); } catch (ignored) {}
        await runSource(previous);
      } else {
        throw error;
      }
    }
  }
} catch (error) {
  await offlineWidget(error);
}
