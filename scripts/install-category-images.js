
var fs = require("fs");
var path = require("path");

var webRoot = path.join(__dirname, "..");
var assetsDir = "C:\\Users\\home\\.cursor\\projects\\d-matrix\\assets";

var categoryIds = [
  "c01fistik",
  "c02findik",
  "c03badem",
  "c04yerfist",
  "c05kurumey",
  "c06meycip",
  "c07kuruseb",
  "c08recel",
  "c09gelenek",
  "c10meyves",
  "c11pekmez",
  "c12sut",
  "c13konserve",
  "c14siviya",
  "c15aromya",
  "c16iqfseb",
  "c17iqfmey"
];

function ensureImgField(obj) {
  if (!obj || typeof obj !== "object") {
    return;
  }
  obj.img = "index.webp";
}

function patchCategoryJson() {
  var catPath = path.join(webRoot, "category.json");
  var data = JSON.parse(fs.readFileSync(catPath, "utf8"));
  var i;
  var item;
  var patched = 0;
  for (i = 0; i < data.data.length; i++) {
    item = data.data[i];
    if (categoryIds.indexOf(item.id) !== -1) {
      ensureImgField(item);
      patched++;
    }
  }
  fs.writeFileSync(catPath, JSON.stringify(data, null, 2) + "\n", "utf8");
  return patched;
}

function patchPageIndex(id) {
  var pagePath = path.join(webRoot, "page", id, "index.json");
  if (!fs.existsSync(pagePath)) {
    return false;
  }
  var page = JSON.parse(fs.readFileSync(pagePath, "utf8"));
  ensureImgField(page);
  fs.writeFileSync(pagePath, JSON.stringify(page, null, 2) + "\n", "utf8");
  return true;
}

function processOne(sharp, id) {
  var png = path.join(assetsDir, id + ".png");
    var pageDir = path.join(webRoot, "page", id);
    var imgDir = path.join(webRoot, "img", id);
    var pageWebp = path.join(pageDir, "index.webp");
    var imgWebp = path.join(imgDir, "index.webp");

    if (!fs.existsSync(png)) {
      return Promise.reject(new Error("PNG yok: " + png));
    }
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
    }
    return sharp(png)
      .resize(1200, 900, { fit: "cover", position: "centre" })
      .webp({ quality: 85 })
      .toFile(pageWebp)
      .then(function () {
        fs.copyFileSync(pageWebp, imgWebp);
        patchPageIndex(id);
        console.log("OK", id, "-> page/" + id + "/index.webp");
        return id;
      });
}

function runAll() {
  var sharp;
  var chain;
  var j;

  if (!fs.existsSync(assetsDir)) {
    console.error("[HATA] assets:", assetsDir);
    process.exit(1);
  }

  try {
    sharp = require(path.join(__dirname, "..", "..", "..", "..", "..", "..", "node_modules", "sharp"));
  } catch (e1) {
    try {
      sharp = require("sharp");
    } catch (e2) {
      console.error("[HATA] sharp yuklu degil");
      process.exit(1);
    }
  }

  chain = Promise.resolve();
  for (j = 0; j < categoryIds.length; j++) {
    (function (id) {
      chain = chain.then(function () {
        return processOne(sharp, id);
      });
    })(categoryIds[j]);
  }

  chain
    .then(function () {
      var catPatched = patchCategoryJson();
      console.log("category.json:", catPatched, "kategori img eklendi");
      process.exit(0);
    })
    .catch(function (err) {
      console.error(err.message || err);
      process.exit(1);
    });
}

runAll();
