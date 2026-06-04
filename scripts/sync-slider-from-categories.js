
var fs = require("fs");
var path = require("path");

var webRoot = path.join(__dirname, "..");
var categoryPath = path.join(webRoot, "category.json");
var modulesPath = path.join(webRoot, "modules.json");
var sliderModuleId = "k4t90c";
var maxDescLen = 140;

var buttonLabels = {
  tr: "Kategoriyi İncele",
  en: "Explore Category",
  ar: "استكشف الفئة",
  de: "Kategorie ansehen",
  ko: "카테고리 보기"
};

function getSharp() {
  try {
    return require(path.join(__dirname, "..", "..", "..", "..", "..", "..", "node_modules", "sharp"));
  } catch (e1) {
    try {
      return require("sharp");
    } catch (e2) {
      return null;
    }
  }
}


function shortDescription(descObj, lang) {
  var text = "";
  var langs = ["tr", "en", "ar", "de", "ko"];
  var out = {};
  var i;
  var l;
  var cleaned;

  if (!descObj || typeof descObj !== "object") {
    return out;
  }

  for (i = 0; i < langs.length; i++) {
    l = langs[i];
    text = descObj[l] || descObj.tr || "";
    if (typeof text !== "string") {
      text = "";
    }
    cleaned = text.replace(/^Tillo Tarim[^.]*\.\s*/i, "").trim();
    cleaned = cleaned.replace(/^تيلو تاريم[^.]*\.\s*/, "").trim();
    cleaned = cleaned.replace(/\s*…\s*$/, "").replace(/\.\.\.$/, "");
    if (cleaned.length > maxDescLen) {
      cleaned = cleaned.substring(0, maxDescLen - 1).trim() + "…";
    }
    out[l] = cleaned;
  }
  return out;
}


function buildSliderData(categories) {
  var slides = [];
  var n;
  var cat;

  for (n = 0; n < categories.length; n++) {
    cat = categories[n];
    if (!cat || !cat.path || cat.status === "stop") {
      continue;
    }
    slides.push({
      bg: (n + 1) + ".webp",
      bgcolor: "#1B3A4B",
      categoryId: cat.id,
      title: cat.name,
      description: shortDescription(cat.description),
      button: buttonLabels,
      link: cat.path
    });
  }
  return slides;
}

function findSliderModule(modules) {
  var list = modules.data || [];
  var i;
  for (i = 0; i < list.length; i++) {
    if (list[i].id === sliderModuleId) {
      return list[i];
    }
  }
  return null;
}

function syncModulesJson(slides) {
  var modules = JSON.parse(fs.readFileSync(modulesPath, "utf8"));
  var mod = findSliderModule(modules);
  if (!mod) {
    throw new Error("Slider modulu bulunamadi: " + sliderModuleId);
  }
  mod.data = slides;
  fs.writeFileSync(modulesPath, JSON.stringify(modules, null, 2) + "\n", "utf8");
}


function copyCategoryImagesToSlider(categories) {
  var sharp = getSharp();
  var outDir = path.join(webRoot, "img", sliderModuleId);
  var chain = Promise.resolve();
  var n;
  var cat;
  var src;
  var dest;

  if (!sharp) {
    throw new Error("sharp yuklu degil");
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (n = 0; n < categories.length; n++) {
    cat = categories[n];
    if (!cat || !cat.id || cat.status === "stop") {
      continue;
    }
    src = path.join(webRoot, "page", cat.id, "index.webp");
    dest = path.join(outDir, (n + 1) + ".webp");
    if (!fs.existsSync(src)) {
      return Promise.reject(new Error("Kategori gorseli yok: " + src));
    }
    (function (sourcePath, targetPath, label) {
      chain = chain.then(function () {
        return sharp(sourcePath)
          .resize(1920, 600, { fit: "cover", position: "centre" })
          .webp({ quality: 88 })
          .toFile(targetPath)
          .then(function () {
            console.log("Gorsel OK", label, "->", path.basename(targetPath));
          });
      });
    })(src, dest, cat.id);
  }
  return chain;
}

function run() {
  var categoryRoot = JSON.parse(fs.readFileSync(categoryPath, "utf8"));
  var categories = categoryRoot.data || [];
  var slides = buildSliderData(categories);

  if (slides.length === 0) {
    console.error("[HATA] category.json icinde aktif kategori yok");
    process.exit(1);
  }

  syncModulesJson(slides);
  console.log("modules.json slider:", slides.length, "slayt (category.json)");

  copyCategoryImagesToSlider(categories)
    .then(function () {
      console.log("Tamamlandi:", slides.length, "kategori slayt");
      process.exit(0);
    })
    .catch(function (err) {
      console.error(err.message || err);
      process.exit(1);
    });
}

run();
