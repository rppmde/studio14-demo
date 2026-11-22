/**
 * Build the three-language HTML site into canonical Cloudflare clean routes.
 * Defaults to non-indexable staging. Requires Node.js 20+.
 */
import {readdir, readFile, writeFile, mkdir, rm, cp, stat} from "node:fs/promises";
import {resolve, join, dirname, relative, sep} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");
const LANGS = ["en", "ru", "hy"];
const PRODUCTION = process.env.SITE_PRODUCTION === "1";
const ORIGIN = "https://studio14byarthur.com";
const isDir = async p => stat(p).then(s => s.isDirectory()).catch(() => false);
const isFile = async p => stat(p).then(s => s.isFile()).catch(() => false);
const attr = (tag, name) => {
  const re = new RegExp("(?:^|\\s)" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i");
  return re.exec(tag)?.[2] ?? null;
};

const routeBySource = new Map(), pages = [];
for (const language of LANGS) {
  for (const filename of (await readdir(join(ROOT, language))).filter(x => x.endsWith(".html"))) {
    const source = join(ROOT, language, filename);
    const html = await readFile(source, "utf8");
    const canonicalTag = [...html.matchAll(/<link\b[^>]*>/gi)]
      .map(m => m[0]).find(tag => attr(tag,"rel")?.split(/\s+/).includes("canonical"));
    if (!canonicalTag) throw new Error("Missing canonical in " + source);
    const url = new URL(attr(canonicalTag,"href"));
    if (url.origin !== ORIGIN) throw new Error("Unexpected canonical origin: " + url);
    const path = url.pathname.endsWith("/") ? url.pathname : url.pathname + "/";
    if (pages.some(p=>p.path===path)) throw new Error("Duplicate canonical: " + path);
    pages.push({source,language,html,path});
    routeBySource.set(source,path);
  }
}
if (!routeBySource.has(join(ROOT,"en","index.html"))) throw new Error("Missing English homepage");

function rewrite(value, source) {
  if (!value || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(value)) return value;
  const m=/^([^?#]*)([?#].*)?$/.exec(value);
  if (!m || !m[1]) return value;
  const target = resolve(dirname(source),m[1]);
  const clean = routeBySource.get(target);
  if (clean) return clean+(m[2]||"");
  const rel = relative(ROOT,target).split(sep).join("/");
  if (!rel.startsWith("../") && rel!=="..") return "/"+rel+(m[2]||"");
  throw new Error("Reference escapes repository: "+value+" in "+source);
}
function transform(html,page) {
  html = html.replace(/(\b(?:href|src|poster)=)(["'])(.*?)\2/gi,
    (_whole,name,q,value)=>name+q+rewrite(value,page.source)+q);
  html = html.replace(/(\bsrcset=)(["'])(.*?)\2/gi, (_whole,name,q,value)=>{
    const changed=value.split(",").map(item=>item.replace(/^(\s*)(\S+)/,
      (_s,spaces,url)=>spaces+rewrite(url,page.source))).join(",");
    return name+q+changed+q;
  });
  if (PRODUCTION) html=html.replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>/gi,"");
  return html;
}
await rm(DIST,{recursive:true,force:true});
await mkdir(DIST,{recursive:true});
for(const folder of ["assets","css","js","fonts"]) {
  if (await isDir(join(ROOT,folder))) await cp(join(ROOT,folder),join(DIST,folder),{recursive:true});
}
for (const page of pages) {
  const output=join(DIST,page.path.replace(/^\//,""));
  await mkdir(output,{recursive:true});
  await writeFile(join(output,"index.html"),transform(page.html,page),"utf8");
}
const headers=[
  "/*",
  "  X-Content-Type-Options: nosniff",
  "  Referrer-Policy: strict-origin-when-cross-origin",
  "  Cache-Control: public, max-age=0, must-revalidate",
  ...(PRODUCTION?[]:["  X-Robots-Tag: noindex, nofollow"]),
  "",
  "/assets/*",
  "  Cache-Control: public, max-age=86400",
  "",
  "/css/*",
  "  Cache-Control: public, max-age=3600",
  "",
  "/js/*",
  "  Cache-Control: public, max-age=3600",
  ""
];
await writeFile(join(DIST,"_headers"),headers.join("\n"));
if (PRODUCTION) {
  const all=pages.map(p=>"  <url><loc>"+ORIGIN+p.path+"</loc></url>");
  await writeFile(join(DIST,"sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+all.join("\n")+'\n</urlset>\n');
  await writeFile(join(DIST,"robots.txt"),"User-agent: *\nAllow: /\nSitemap: "+ORIGIN+"/sitemap.xml\n");
} else {
  await writeFile(join(DIST,"robots.txt"),"User-agent: *\nDisallow: /\n");
}
let broken=0;
for (const page of pages) {
  const file=join(DIST,page.path.replace(/^\//,""),"index.html");
  const html=await readFile(file,"utf8");
  const refs=[
    ...[...html.matchAll(/\b(?:href|src|poster)=(["'])(.*?)\1/gi)].map(x=>x[2]),
    ...[...html.matchAll(/\bsrcset=(["'])(.*?)\1/gi)].flatMap(x=>x[2].split(",").map(s=>s.trim().split(/\s+/)[0]))
  ];
  for(const ref of refs){
    if(!ref.startsWith("/") || ref.startsWith("//"))continue;
    const path=ref.split(/[?#]/,1)[0],target=join(DIST,path.replace(/^\//,""));
    if(!(await isFile(target)) && !(await isFile(join(target,"index.html")))){
      if(broken++<20)console.error("BROKEN",page.path,ref);
    }
  }
}
if(broken)throw new Error(broken+" broken local URLs");
console.log("Built",pages.length,"pages in",DIST,"| mode:",PRODUCTION?"production":"review (noindex)");
