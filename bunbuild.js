import { sleepSync } from "bun";
import { existsSync, mkdirSync, rmdirSync} from "node:fs";
import { readdir } from "node:fs/promises";

const rootdir = './src/';
const outdir = './build/scorm-solver/';

const manifest = 'manifest.json';
const iconsDir = `${rootdir}/icons`;
const iconsOutdir = `${outdir}/icons`;

rmdirSync(outdir, {recursive: true});
sleepSync(200);

const build = Bun.build({
  root: rootdir,
  entrypoints: [
    "scorm.tsx",
    "kineo/content.tsx"
  ],
  outdir: outdir
});
build
  .then((r)=>{console.log(r)})
  .catch((e)=>{console.error(e)});

await Bun.write(`${outdir}/${manifest}`, Bun.file(`${rootdir}/${manifest}`));

if ( ! existsSync( iconsOutdir )){
  mkdirSync(iconsOutdir, {recursive: true});    
}

const iconFiles = readdir(iconsDir, {recursive: true});
iconFiles.then(
  (files)=>{
    files.forEach((file)=>{
      Bun.write(`${iconsOutdir}/${file}`, Bun.file(`${iconsDir}/${file}`));
    });
  },
  ()=>{ return false },
)
