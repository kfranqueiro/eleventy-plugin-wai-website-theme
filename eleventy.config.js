import pluginWai from "eleventy-plugin-wai-website-theme";

export default async function (eleventyConfig) {
  await eleventyConfig.addPlugin(pluginWai);

  eleventyConfig.addGlobalData("baseUrl", "https://w3c.github.io");
  eleventyConfig.addGlobalData("layout", "default.html");

  return {
    dir: {
      layouts: "_layouts",
    }
  }
}
