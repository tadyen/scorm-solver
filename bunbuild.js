import { existsSync, mkdirSync} from "node:fs";
import { readdir } from "node:fs/promises";

const rootdir = './src';
const outdir = './build/scorm-solver';

const manifest = 'manifest.json';
const iconsDir = `${rootdir}/icons`;
const iconsOutdir = `${outdir}/icons`;

await Bun.build({
    root: rootdir,
    entrypoints: ["background_script.ts"],
    outdir: outdir
});

await Bun.build({
    root: rootdir,
    entrypoints: ["content_script.ts"],
    outdir: outdir
});

await Bun.build({
    root: rootdir,
    entrypoints: ["browserAction/index.html"],
    outdir: `${outdir}`
});

await Bun.build({
    root: rootdir,
    entrypoints: ["pageAction/index.html"],
    outdir: `${outdir}`
});

await Bun.build({
    root: rootdir,
    entrypoints: ["options/index.html"],
    outdir: `${outdir}`
});

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
