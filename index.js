import { EleventyRenderPlugin } from "@11ty/eleventy";
import { attrs } from "@mdit/plugin-attrs";
import { dl } from "@mdit/plugin-dl";
import markdownItFootnote from "markdown-it-footnote";
import glob from "fast-glob";
import { access, readFile, unlink, writeFile } from "fs/promises";
import { mkdirp } from "mkdirp";
import { join } from "path";

const fileExists = (filename) =>
  access(filename).then(
    () => true,
    () => false
  );

const pluginName = JSON.parse(
  await readFile(join(import.meta.dirname, "package.json"), "utf8")
).name;

const assetsOutputDir = "assets";
const waiWebsiteThemeDir = join("node_modules", "wai-website-theme");
const waiIncludesDir = join(waiWebsiteThemeDir, "_includes");

/**
 * Performs replacements on wai-website-theme component includes
 * @param {string} filename
 */
async function performReplacements(filename) {
  let content = (await readFile(join(waiIncludesDir, filename), "utf8"))
    // Translate custom Jekyll plugin (TODO: try passing cache: true to LiquidJS)
    .replace(/include_cached/g, "include")
    // Translate Jekyll's relative_url filter to Eleventy's url
    .replace(/\|\s*relative_url/g, "| url")
    // Translate Jekyll's markdownify filter to Eleventy shortcode
    .replace(
      "{{page.doc-note-message-md | markdownify }}",
      `{% renderTemplate "liquid,md" %}{{ page.doc-note-message-md }}{% endrenderTemplate %}`
    )
    // Jekyll namespaces data under page.* and site.data.*; Eleventy doesn't
    .replace(/\bpage\./g, "")
    .replace(/\bsite\.data\./g, "")
    // Typos (do these work in the theme repo??)
    .replace(/include\.\.id/g, "include.id")
    .replace(/endif- %}/g, "endif -%}")
    // Unnecessary parens that apparently confuse LiquidJS
    .replace(/if \(([\w\.]+ and [\w\.]+)\)/g, "if $1")
    // More unnecessary parens
    .replace(
      "if (include.type != 'start') and (include.type != 'end')",
      "if include.type != 'start' and include.type != 'end'"
    );

  if (filename !== "image.html") {
    // Ensure whitespace around if/endif are truncated,
    // to avoid unwittingly creating markdown paragraphs
    content = content.replace(/\{% if/g, "{%- if").replace(/\{%-? endif -?%\}/g, "{%- endif -%}");
  }

  return content;
}

export default async function (eleventyConfig) {
  try {
    eleventyConfig.versionCheck(">=3.0");
  } catch (e) {
    console.warn(`[${pluginName}] WARN Eleventy plugin compatibility: ${e.message}`);
  }

  eleventyConfig.addPassthroughCopy({
    [`${waiWebsiteThemeDir}/assets`]: assetsOutputDir,
  });
  eleventyConfig.addPassthroughCopy("content-images");

  eleventyConfig.setLiquidOptions({
    jekyllInclude: true, // Necessary for compatibility with wai-website-theme templates
  });

  eleventyConfig.amendLibrary("md", (mdLib) => {
    mdLib.use(attrs);
    mdLib.use(dl);
    mdLib.use(markdownItFootnote);
    mdLib.renderer.rules.footnote_block_open = () => `<div class="footnotes"><ol>`;
    mdLib.renderer.rules.footnote_block_close = () => "</ol></div>";
  });

  eleventyConfig.addPlugin(EleventyRenderPlugin);

  // Add equivalent to Jekyll filter
  eleventyConfig.addLiquidFilter("absolute_url", function (value) {
    if (!this.baseUrl)
      throw new Error(
        "absolute_url filter requires baseUrl in data (in the format `http[s]://domain.tld`)"
      );
    return this.baseUrl.replace(/\/$/, "") + eleventyConfig.pathPrefix + value;
  });

  // Exclude site-specific includes (which are not documented components)
  const excludes = [
    "feedback-box.html",
    "t-status.html",
    "header.html",
    "footer.html",
    "sidenav.html",
    "toc.html", // Uses kramdown syntax ({::options}, {:toc})
  ];
  const waiIncludesFilenames = [];
  for (const filename of await glob("**", { cwd: waiIncludesDir })) {
    if (await fileExists(join(eleventyConfig.dir.includes, filename))) {
      console.warn(`[${pluginName}] WARN Not overwriting existing include ${filename}`);
      continue;
    }
    if (!excludes.includes(filename)) waiIncludesFilenames.push(filename);
  }

  // Avoid churning in serve/watch mode due to files this plugin writes
  for (const filename of waiIncludesFilenames) {
    eleventyConfig.watchIgnores.add(`${eleventyConfig.dir.includes}/${filename}`);
  }

  // Unfortunately, while Eleventy supports virtual _layout_ templates,
  // it does not support other includes virtually. https://github.com/11ty/eleventy/issues/3501
  // (Presumably it doesn't patch Liquid's lookup logic.)
  // Attempts to set Liquid's templates option have failed as well.
  // This is an ugly workaround, which temporarily copies the templates to
  // the project's own includes folder.
  eleventyConfig.on("eleventy.before", async ({ dir }) => {
    await mkdirp(dir.includes);
    for (const filename of waiIncludesFilenames) {
      await writeFile(join(dir.includes, filename), await performReplacements(filename));
    }
  });

  // NOTE: This does NOT run after errors. https://github.com/11ty/eleventy/issues/3500
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    for (const filename of waiIncludesFilenames) {
      await unlink(join(dir.includes, filename));
    }
  });
}
