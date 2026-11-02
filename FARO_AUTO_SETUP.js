// FARO · ONE-TIME Scriptable auto-update installer
// Run once. Updates existing FARO Zeeland v14/v15 IN PLACE, keeping the
// iPhone's widget assignment and settings. Saves a copy before replacing it.
// Subsequent FARO updates are automatic when iOS refreshes the widget.

const URL =
  "https://raw.githubusercontent.com/lukileke/zeeland-surf-check/main/FARO_AUTO_WIDGET.js";

async function notice(title, message) {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  alert.addAction("Entendido");
  await alert.presentAlert();
}
try {
  const request = new Request(URL + "?install=" + Date.now());
  request.timeoutInterval = 15;
  const loader = await request.loadString();
  if (
    loader.length < 2500 ||
    !loader.includes("FARO_RAW") ||
    !loader.includes("FARO_CACHE") ||
    !loader.includes("runSource(source)")
  ) throw new Error("GitHub no entregó el instalador automático correcto.");

  const clouds = [
    {fm: FileManager.iCloud(), name: "iCloud"},
    {fm: FileManager.local(), name: "local"}
  ];
  const names = ["FARO Zeeland v14.js", "FARO Zeeland v15.js"];
  let target = null;
  for (const file of names) {
    for (const storage of clouds) {
      const location = storage.fm.joinPath(storage.fm.documentsDirectory(), file);
      if (storage.fm.fileExists(location)) {
        target = {fm: storage.fm, location, name: file, cloud: storage.name};
        break;
      }
    }
    if (target) break;
  }

  if (target) {
    const fm = target.fm;
    if (
      target.cloud === "iCloud" &&
      typeof fm.isFileDownloaded === "function" &&
      !fm.isFileDownloaded(target.location)
    ) await fm.downloadFileFromiCloud(target.location);

    const old = fm.readString(target.location);
    if (
      !old.includes("Deep Ocean Editorial v14") &&
      !old.includes("Deep Ocean Editorial v15") &&
      !old.includes("FARO_RAW")
    ) throw new Error("El script existente no parece ser FARO. No se ha modificado.");

    if (old.includes("FARO_RAW") && old.includes("FARO_CACHE")) {
      await notice("FARO ya es automático", "Tu widget ya consulta GitHub en cada actualización.");
    } else {
      // Never overwrite an existing backup.
      const backup = fm.joinPath(
        fm.documentsDirectory(),
        "FARO anterior - " + Date.now() + ".txt"
      );
      fm.writeString(backup, old);
      fm.writeString(target.location, loader);
      await notice(
        "FARO ahora se actualiza solo",
        "He actualizado «" + target.name.replace(".js", "") +
        "» y guardado una copia de seguridad.\n\n" +
        "No tienes que cambiar el widget en la pantalla de inicio. " +
        "Ejecuta el script FARO una vez para descargar la versión actual."
      );
    }
  } else {
    // Fallback for manually renamed Scriptable scripts.
    const fm = clouds[0].fm;
    const location = fm.joinPath(fm.documentsDirectory(), "FARO Auto.js");
    if (fm.fileExists(location)) {
      throw new Error("Ya existe «FARO Auto». No se ha sobrescrito.");
    }
    fm.writeString(location, loader);
    await notice(
      "FARO Auto instalado",
      "No encontré un script llamado FARO Zeeland v14/v15. " +
      "Creé «FARO Auto».\n\n" +
      "Selecciona «FARO Auto» una sola vez en tu widget de iPhone. " +
      "Conserva el parámetro BEST|ES|STYLE=FLOW|THEME=DARK."
    );
  }
} catch (error) {
  await notice("FARO: instalación cancelada", String(error));
}
Script.complete();
