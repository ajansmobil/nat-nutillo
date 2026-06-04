
var fs = require("fs");
var path = require("path");

var webRoot = path.join(__dirname, "..");
var assetsDir = path.join(
  "C:\\Users\\home\\.cursor\\projects\\d-matrix",
  "assets"
);
var sliderModuleId = "k4t90c";
var slideCount = 10;

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

function processOne(sharp, num) {
  var nn = num < 10 ? "0" + num : String(num);
  var png = path.join(assetsDir, "slider-" + nn + ".png");
  var outDir = path.join(webRoot, "img", sliderModuleId);
  var outWebp = path.join(outDir, num + ".webp");

  if (!fs.existsSync(png)) {
    return Promise.reject(new Error("PNG yok: " + png));
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  return sharp(png)
    .resize(1920, 600, { fit: "cover", position: "centre" })
    .webp({ quality: 88 })
    .toFile(outWebp)
    .then(function () {
      console.log("OK", num + ".webp");
      return num;
    });
}

function runAll() {
  var sharp = getSharp();
  var chain;
  var n;

  if (!sharp) {
    console.error("[HATA] sharp yuklu degil");
    process.exit(1);
  }
  if (!fs.existsSync(assetsDir)) {
    console.error("[HATA] assets:", assetsDir);
    process.exit(1);
  }

  chain = Promise.resolve();
  for (n = 1; n <= slideCount; n++) {
    (function (num) {
      chain = chain.then(function () {
        return processOne(sharp, num);
      });
    })(n);
  }

  chain
    .then(function () {
      console.log("Slider gorselleri hazir:", slideCount, "dosya");
      process.exit(0);
    })
    .catch(function (err) {
      console.error(err.message || err);
      process.exit(1);
    });
}

runAll();
