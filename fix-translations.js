
var fs = require("fs");
var path = require("path");

var WEB = __dirname;
var SCRIPTS = path.join(WEB, "../../../../../scripts");
var i18n = require(path.join(SCRIPTS, "nat-nutillo-i18n-phrases"));
var corporate = require(path.join(SCRIPTS, "nat-nutillo-i18n-corporate"));

var dryRun = process.argv.indexOf("--dry-run") >= 0;
var LANG_FIELDS = ["name", "description", "keyword", "title", "text"];
var LANGS = i18n.LANGS.slice();
var BRAND = i18n.BRAND;
var activeLangs = ["tr"];
var allLangKeys = ["tr"];

var stats = {
  files: 0,
  langFilled: 0,
  retranslated: 0,
  textBuilt: 0,
  keysRemoved: 0,
  synced: 0
};

var SORTED_PHRASES = i18n.PHRASES.slice().sort(function (a, b) {
  return b[0].length - a[0].length;
});
var LANG_INDEX = { en: 1, ar: 2, de: 3, ko: 4 };

var EXTRA_PHRASES = [
  ["kurumsal bilgiler", "corporate information", "معلومات مؤسسية", "Unternehmensinformationen", "기업 정보"],
  ["Hakkımızda, misyon, vizyon ve kalite politikamız", "About us, mission, vision and quality policy", "من نحن والرسالة والرؤية وسياسة الجودة", "Über uns, Mission, Vision und Qualitätspolitik", "회사 소개, 미션, 비전, 품질 정책"],
  ["doğal gıda üretimi", "natural food production", "إنتاج أغذية طبيعية", "Naturkostproduktion", "천연 식품 생산"],
  ["Toptan sipariş, bayilik ve ürün bilgisi için bize ulaşın", "Reach us for wholesale orders, distributorship and product information", "للطلبات بالجملة والوكالة ومعلومات المنتجات تواصلوا معنا", "Für Großbestellungen, Vertrieb und Produktinformationen kontaktieren Sie uns", "도매·대리점·제품 문의는 연락 주세요"],
  ["Gaziantep ve Türkiye geneli tedarik", "Supply across Gaziantep and Turkey", "توريد من غازي عنتاب وعبر تركيا", "Lieferung aus Gaziantep und in der gesamten Türkei", "가지안테프 및 터키 전역 공급"],
  ["Antep fıstığı ezme ve krema: kavrulmuş, doğal ve kremamsı çeşitler", "Gaziantep pistachio paste and cream: roasted, natural and creamy varieties", "معجون وكريمة فستق عنتاب: أصناف محمصة وطبيعية وكريمية", "Antep-Pistazienpaste und -creme: geröstete, natürliche und cremige Sorten", "가지안테프 피스타치오 페이스트·크림: 로스팅·천연·크리미 제품"],
  ["Gaziantep menşeli Antep fıstığından üretilen", "produced from Gaziantep pistachios from Gaziantep", "منتج من فستق عنتاب من غازي عنتاب", "hergestellt aus Antep-Pistazien aus Gaziantep", "가지안테프산 가지안테프 피스타치오로 생산"],
  ["Tillo Tarim ürünleri seçilmiş hammaddeden, katkısız ve izlenebilir üretim anlayışıyla Gaziantep tesislerimizde hazırlanır. Toptan sipariş ve numune talepleri için iletişim sayfamızdan bize ulaşabilirsiniz.", "Tillo Tarim products are prepared at our Gaziantep facility from selected ingredients with an additive-free, traceable approach. For wholesale orders and samples, contact us via our contact page.", "تُحضَّر منتجات تيلو تاريم في منشأة غازي عنتاب من مواد خام مختارة بإنتاج قابل للتتبع وخالٍ من الإضافات غير الضرورية. للطلبات بالجملة والعينات تواصلوا معنا عبر صفحة الاتصال.", "Tillo Tarim-Produkte werden in unserer Anlage in Gaziantep aus ausgewählten Rohstoffen nachvollziehbar und möglichst ohne Zusatzstoffe hergestellt. Für Großbestellungen und Muster kontaktieren Sie uns über die Kontaktseite.", "Tillo Tarim 제품은 엄선 원료로 가지안테프 시설에서 무첨가·이력 추적 생산합니다. 도매·샘플 문의는 문의 페이지를 이용해 주세요."]
];
var ALL_PHRASES = SORTED_PHRASES.concat(
  EXTRA_PHRASES.sort(function (a, b) {
    return b[0].length - a[0].length;
  })
);
var FOOTER = EXTRA_PHRASES.filter(function (row) {
  return row[0].indexOf("ürünleri seçilmiş") >= 0;
})[0];


function loadActiveLangs() {
  var settingPath = path.join(WEB, "setting.json");
  var setting = JSON.parse(fs.readFileSync(settingPath, "utf8"));
  activeLangs = ["tr"];
  allLangKeys = ["tr"];
  var code;
  for (code in setting.langs) {
    if (Object.prototype.hasOwnProperty.call(setting.langs, code) && setting.langs[code] === true && code !== "tr") {
      activeLangs.push(code);
      allLangKeys.push(code);
    }
  }
}


function translateTr(tr, lang) {
  if (!tr || typeof tr !== "string") {
    return "";
  }
  if (lang === "tr") {
    return tr;
  }
  var idx = LANG_INDEX[lang];
  if (idx === undefined) {
    return tr;
  }
  var out = tr;
  var i;
  for (i = 0; i < ALL_PHRASES.length; i++) {
    var row = ALL_PHRASES[i];
    if (row[0] && out.indexOf(row[0]) >= 0) {
      out = out.split(row[0]).join(row[idx] || row[1] || row[0]);
    }
  }
  return out;
}


function hasTurkish(s) {
  if (!s || typeof s !== "string") {
    return false;
  }
  return /[ğüşöçıİĞÜŞÖÇ]/.test(s) || /\b(ve|için|grubunda|ürün|tesislerimizde|iletişim|kurumsal|bilgiler|politikamız|üretimi|tedarik|iletişim)\b/i.test(s);
}


function stripInactiveLangKeys(obj) {
  if (!obj || typeof obj !== "object" || typeof obj.tr !== "string") {
    return;
  }
  var keys = Object.keys(obj);
  var i;
  for (i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (allLangKeys.indexOf(k) < 0) {
      delete obj[k];
      stats.keysRemoved++;
    }
  }
}


function fixLangObject(obj, forceRetranslate) {
  if (!obj || typeof obj !== "object" || typeof obj.tr !== "string") {
    return;
  }
  var tr = String(obj.tr || "").trim();
  if (!tr) {
    return;
  }
  stripInactiveLangKeys(obj);
  var i;
  for (i = 0; i < activeLangs.length; i++) {
    var lang = activeLangs[i];
    if (lang === "tr") {
      continue;
    }
    var cur = obj[lang];
    var needsFix = !cur || !String(cur).trim() || forceRetranslate || hasTurkish(cur);
    if (needsFix) {
      obj[lang] = translateTr(tr, lang);
      stats.langFilled++;
      if (forceRetranslate || hasTurkish(cur)) {
        stats.retranslated++;
      }
    }
  }
}


function buildSimpleText(page, lang) {
  var name = (page.name && page.name[lang]) || translateTr(page.name.tr, lang);
  var desc = (page.description && page.description[lang]) || translateTr(page.description.tr, lang);
  var html = '<h2 style="font-size: 24px;">' + name + "</h2>\n";
  html += '<p style="font-size: 16px;">' + desc + "</p>";
  return html;
}


function buildProductText(page, lang) {
  var labels = i18n.FIELD_LABELS;
  var name = (page.name && page.name[lang]) || translateTr(page.name.tr, lang);
  var desc = (page.description && page.description[lang]) || translateTr(page.description.tr, lang);
  var gramaj = (page.desc && page.desc.gramaj) || "";
  var ambalaj = page.desc && page.desc.ambalaj ? translateTr(page.desc.ambalaj, lang) : "";
  var mensei = page.desc && page.desc.mensei ? translateTr(page.desc.mensei, lang) : translateTr("Türkiye", lang);
  var footer = FOOTER ? FOOTER[LANG_INDEX[lang]] || FOOTER[1] : "";
  var lg = labels.gramaj[lang] || labels.gramaj.en;
  var la = labels.ambalaj[lang] || labels.ambalaj.en;
  var lm = labels.mensei[lang] || labels.mensei.en;
  var html = "";
  html += '<h2 style="font-size: 22px;">' + name + "</h2>\n";
  html += '<p style="font-size: 16px;">' + desc + "</p>\n";
  html += '<ul style="font-size: 16px; line-height: 1.7;">\n';
  if (gramaj) {
    html += "<li><strong>" + lg + ":</strong> " + gramaj + "</li>\n";
  }
  if (ambalaj) {
    html += "<li><strong>" + la + ":</strong> " + ambalaj + "</li>\n";
  }
  if (mensei) {
    html += "<li><strong>" + lm + ":</strong> " + mensei + "</li>\n";
  }
  html += "</ul>\n";
  if (footer) {
    html += '<p style="font-size: 15px;">' + footer + "</p>";
  }
  return html;
}


function applyCorporatePack(page) {
  var pack = page.id && corporate[page.id];
  if (!pack) {
    return;
  }
  var lang;
  if (pack.description && page.description) {
    for (lang in pack.description) {
      if (Object.prototype.hasOwnProperty.call(pack.description, lang)) {
        page.description[lang] = pack.description[lang];
      }
    }
  }
  if (pack.keyword && page.keyword) {
    for (lang in pack.keyword) {
      if (Object.prototype.hasOwnProperty.call(pack.keyword, lang)) {
        page.keyword[lang] = pack.keyword[lang];
      }
    }
  }
  if (pack.text && page.text) {
    for (lang in pack.text) {
      if (Object.prototype.hasOwnProperty.call(pack.text, lang)) {
        page.text[lang] = pack.text[lang];
      }
    }
  }
}


function fixPageRecord(page, opts) {
  if (!page || !page.name || !page.name.tr) {
    return;
  }
  opts = opts || {};
  if (page.name) {
    fixLangObject(page.name, false);
  }
  if (page.description) {
    fixLangObject(page.description, true);
  }
  if (page.keyword) {
    fixLangObject(page.keyword, true);
  }
  if (page.title) {
    var i;
    for (i = 0; i < activeLangs.length; i++) {
      var lang = activeLangs[i];
      var nm = page.name[lang] || translateTr(page.name.tr, lang);
      page.title[lang] = nm + " | " + BRAND;
    }
    stripInactiveLangKeys(page.title);
  }
  applyCorporatePack(page);
  if (!page.text) {
    page.text = { tr: "" };
  }
  var isCategory = page.id && String(page.id).indexOf("c") === 0 && page.id.length <= 10;
  var isProduct = page.desc && (page.desc.gramaj || page.desc.ambalaj);
  var isHub = page.id === "yvi9dlb59o" || page.id === "xnzu5au0ag" || page.id === "hs54qzyeyo";
  if (isProduct && !opts.skipProductText) {
    page.text.tr = buildProductText(page, "tr");
    var j;
    for (j = 0; j < LANGS.length; j++) {
      var lng = LANGS[j];
      page.text[lng] = buildProductText(page, lng);
    }
    stats.textBuilt++;
  } else if (isCategory || isHub || !String(page.text.tr || "").trim()) {
    page.text.tr = buildSimpleText(page, "tr");
    var k;
    for (k = 0; k < LANGS.length; k++) {
      var lng2 = LANGS[k];
      page.text[lng2] = buildSimpleText(page, lng2);
    }
    stats.textBuilt++;
  } else if (page.text) {
    fixLangObject(page.text, true);
  }
  stripInactiveLangKeys(page.text);
}


function copyLangFields(target, source) {
  var keys = ["name", "title", "description", "keyword"];
  var k;
  var lang;
  for (k = 0; k < keys.length; k++) {
    var key = keys[k];
    if (!source[key]) {
      continue;
    }
    if (!target[key]) {
      target[key] = { tr: "" };
    }
    for (lang in source[key]) {
      if (Object.prototype.hasOwnProperty.call(source[key], lang) && source[key][lang]) {
        target[key][lang] = source[key][lang];
      }
    }
    stripInactiveLangKeys(target[key]);
  }
}


function processJsonFile(rel, handler) {
  var full = path.join(WEB, rel);
  if (!fs.existsSync(full)) {
    return null;
  }
  var data = JSON.parse(fs.readFileSync(full, "utf8"));
  if (handler) {
    handler(data, rel);
  }
  if (!dryRun) {
    fs.writeFileSync(full, JSON.stringify(data, null, 2) + "\n", "utf8");
  }
  stats.files++;
  return data;
}


function fixSetting(setting) {
  setting.description = i18n.SITE.description;
  setting.keyword = i18n.SITE.keyword;
  stripInactiveLangKeys(setting.description);
  stripInactiveLangKeys(setting.keyword);
}


function fixPageJsonMenu(data) {
  if (!data.data || !corporate.menuSeo) {
    return;
  }
  var i;
  for (i = 0; i < data.data.length; i++) {
    var row = data.data[i];
    var seo = corporate.menuSeo[row.path];
    if (!seo) {
      if (row.name) {
        fixLangObject(row.name, false);
      }
      if (row.description) {
        fixLangObject(row.description, true);
      }
      continue;
    }
    if (seo.name && row.name) {
      var ln;
      for (ln in seo.name) {
        row.name[ln] = seo.name[ln];
      }
    }
    if (seo.description) {
      if (!row.description) {
        row.description = { tr: "" };
      }
      for (ln in seo.description) {
        row.description[ln] = seo.description[ln];
      }
    }
    if (seo.keyword) {
      if (!row.keyword) {
        row.keyword = { tr: "" };
      }
      for (ln in seo.keyword) {
        row.keyword[ln] = seo.keyword[ln];
      }
    }
    fixPageRecord(row, { skipProductText: true });
  }
}


function fixCategoryJson() {
  var catMap = {};
  processJsonFile("category.json", function (data) {
    var i;
    for (i = 0; i < data.data.length; i++) {
      var row = data.data[i];
      fixPageRecord(row, { skipProductText: true });
      catMap[row.id] = row;
    }
  });
  return catMap;
}


function syncCategoryPages(catMap) {
  var pageRoot = path.join(WEB, "page");
  var dirs = fs.readdirSync(pageRoot);
  var i;
  for (i = 0; i < dirs.length; i++) {
    var id = dirs[i];
    if (id.indexOf("c") !== 0 || !catMap[id]) {
      continue;
    }
    var rel = "page/" + id + "/index.json";
    processJsonFile(rel, function (page) {
      copyLangFields(page, catMap[id]);
      fixPageRecord(page, { skipProductText: true });
      stats.synced++;
    });
  }
}


function syncProductsList() {
  processJsonFile("products.json", function (products) {
    var i;
    for (i = 0; i < products.data.length; i++) {
      var p = products.data[i];
      var pf = path.join(WEB, "page", p.id, "index.json");
      if (!fs.existsSync(pf)) {
        continue;
      }
      var page = JSON.parse(fs.readFileSync(pf, "utf8"));
      copyLangFields(p, page);
      stats.synced++;
    }
    if (products.desc) {
      var d;
      for (d = 0; d < products.desc.length; d++) {
        var field = products.desc[d];
        delete field.title;
        delete field.keyword;
        delete field.description;
        var labels = i18n.FIELD_LABELS[field.path];
        if (labels) {
          field.name = labels;
          stripInactiveLangKeys(field.name);
        }
      }
    }
  });
}


function processAllPageDirs(catMap) {
  var skipIds = { yvi9dlb59o: 1, hs54qzyeyo: 1, xnzu5au0ag: 1 };
  var pageRoot = path.join(WEB, "page");
  var dirs = fs.readdirSync(pageRoot);
  var i;
  for (i = 0; i < dirs.length; i++) {
    var id = dirs[i];
    if (skipIds[id]) {
      continue;
    }
    if (id.indexOf("c") === 0 && catMap[id]) {
      continue;
    }
    var rel = "page/" + id + "/index.json";
    processJsonFile(rel, function (page) {
      fixPageRecord(page, { skipProductText: false });
    });
  }
}


function fixHubPages() {
  var hubs = [
    { id: "yvi9dlb59o", seoKey: "kurumsal" },
    { id: "hs54qzyeyo", seoKey: "urunler" },
    { id: "xnzu5au0ag", seoKey: "iletisim", corpKey: "xnzu5au0ag" }
  ];
  var h;
  for (h = 0; h < hubs.length; h++) {
    var hub = hubs[h];
    var rel = "page/" + hub.id + "/index.json";
    processJsonFile(rel, function (page) {
      var seo = corporate.menuSeo[hub.seoKey];
      var corp = hub.corpKey && corporate[hub.corpKey];
      var ln;
      if (seo && seo.name && page.name) {
        for (ln in seo.name) {
          page.name[ln] = seo.name[ln];
        }
      }
      if (seo && seo.description) {
        if (!page.description) {
          page.description = { tr: "" };
        }
        for (ln in seo.description) {
          page.description[ln] = seo.description[ln];
        }
      }
      if (corp && corp.description) {
        for (ln in corp.description) {
          page.description[ln] = corp.description[ln];
        }
      }
      if (seo && seo.keyword && page.keyword) {
        for (ln in seo.keyword) {
          page.keyword[ln] = seo.keyword[ln];
        }
      }
      if (corp && corp.keyword && page.keyword) {
        for (ln in corp.keyword) {
          page.keyword[ln] = corp.keyword[ln];
        }
      }
      if (hub.id === "hs54qzyeyo") {
        page.title = {
          tr: "Ürünlerimiz | " + BRAND,
          en: "Our Products | " + BRAND,
          ar: "منتجاتنا | تيلو تاريم",
          de: "Unsere Produkte | " + BRAND,
          ko: "제품 | " + BRAND
        };
        page.name.tr = "Ürünler";
      } else {
        var ti;
        for (ti = 0; ti < activeLangs.length; ti++) {
          var tlang = activeLangs[ti];
          var tnm = (page.name && page.name[tlang]) || (page.name && page.name.tr) || "";
          if (!page.title) {
            page.title = { tr: "" };
          }
          page.title[tlang] = tnm + " | " + BRAND;
        }
      }
      if (!page.text) {
        page.text = { tr: "" };
      }
      var tx;
      for (tx = 0; tx < activeLangs.length; tx++) {
        var txlang = activeLangs[tx];
        page.text[txlang] = buildSimpleText(page, txlang);
      }
      stripInactiveLangKeys(page.name);
      stripInactiveLangKeys(page.description);
      stripInactiveLangKeys(page.keyword);
      stripInactiveLangKeys(page.title);
      stripInactiveLangKeys(page.text);
      stats.textBuilt++;
    });
  }
}


function fixKurumsalJson() {
  processJsonFile("kurumsal.json", function (data) {
    var i;
    for (i = 0; i < data.data.length; i++) {
      var row = data.data[i];
      var pack = row.id && corporate[row.id];
      if (pack && pack.description && row.description) {
        var ln;
        for (ln in pack.description) {
          row.description[ln] = pack.description[ln];
        }
      }
      fixPageRecord(row, { skipProductText: true });
    }
  });
}


function main() {
  console.log("Tillo Tarim — fix-translations.js" + (dryRun ? " (dry-run)" : ""));
  loadActiveLangs();
  console.log("Aktif diller:", activeLangs.join(", "));

  processJsonFile("setting.json", fixSetting);
  processJsonFile("page.json", fixPageJsonMenu);
  var catMap = fixCategoryJson();
  syncCategoryPages(catMap);
  processAllPageDirs(catMap);
  fixHubPages();
  syncProductsList();
  fixKurumsalJson();

  console.log("İşlenen dosya:", stats.files);
  console.log("Dil alanı doldurma:", stats.langFilled);
  console.log("Yeniden çeviri:", stats.retranslated);
  console.log("Text bloğu üretimi:", stats.textBuilt);
  console.log("Pasif anahtar silme:", stats.keysRemoved);
  console.log("Liste/detay senkron:", stats.synced);
  if (dryRun) {
    console.log("Dry-run: disk yazılmadı.");
  } else {
    console.log("Tamamlandı.");
  }
}

main();
