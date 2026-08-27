import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

/* Un serveur de fichiers minuscule, pour les controles.
   Un service worker refuse file:// : il lui faut un contexte sur, et
   127.0.0.1 en est un. Toutes les verifications passent donc par ici. */

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

export async function servir() {
  const servis = [];
  const serveur = http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split("?")[0]);
    if (rel.endsWith("/")) rel += "index.html";
    const fichier = path.join(RACINE, rel);
    if (!fichier.startsWith(RACINE) || !fs.existsSync(fichier)) {
      servis.push({ rel, code: 404 });
      res.writeHead(404).end("non");
      return;
    }
    const type = TYPES[path.extname(fichier)] || "application/octet-stream";
    servis.push({ rel, code: 200, type });
    res.writeHead(200, { "content-type": type });
    fs.createReadStream(fichier).pipe(res);
  });

  await new Promise((ok) => serveur.listen(0, "127.0.0.1", ok));
  const port = serveur.address().port;

  return {
    base: `http://127.0.0.1:${port}/`,
    jeu: `http://127.0.0.1:${port}/serpentin/`,
    servis,
    arreter: () => serveur.close(),
  };
}
