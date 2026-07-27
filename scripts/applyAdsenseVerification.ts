import fs from "fs";
import path from "path";

const PUBLISHER_ID = "ca-pub-8846628306821055";
const OFFICIAL_ADS_TXT_LINE = "google.com, pub-8846628306821055, DIRECT, f08c47fec0942fa0";
const OFFICIAL_SNIPPET = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}" crossorigin="anonymous"></script>`;

export function applyAdSenseVerification() {
  console.log("==========================================");
  console.log("[ADSENSE VERIFICATION BUILD PRE-CHECK]");
  console.log("==========================================");

  const rootDir = process.cwd();
  const indexHtmlPath = path.join(rootDir, "index.html");
  const adsTxtPath = path.join(rootDir, "public", "ads.txt");

  // 1. Audit /index.html
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
    const occurrences = (indexHtml.match(/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/g) || []).length;
    
    if (occurrences === 0) {
      console.log("[INDEX.HTML] Snippet missing in index.html. Injecting official snippet into <head>...");
      indexHtml = indexHtml.replace("</head>", `    <!-- Google AdSense Official Snippet -->\n    ${OFFICIAL_SNIPPET}\n  </head>`);
      fs.writeFileSync(indexHtmlPath, indexHtml, "utf-8");
      console.log("[INDEX.HTML] Snippet injected successfully.");
    } else if (occurrences === 1) {
      console.log("[INDEX.HTML] Official snippet verified in index.html (1 occurrence inside <head>).");
    } else {
      console.warn(`[INDEX.HTML] WARNING: Multiple occurrences (${occurrences}) found. Deduplicating...`);
      // Keep first, remove duplicates
      const headParts = indexHtml.split("</head>");
      let headContent = headParts[0];
      // Remove all snippets
      headContent = headContent.replace(/<script[^>]*adsbygoogle[^>]*><\/script>/gi, "");
      // Re-insert exactly one
      headContent += `\n    <!-- Google AdSense Official Snippet -->\n    ${OFFICIAL_SNIPPET}\n  `;
      indexHtml = headContent + "</head>" + headParts.slice(1).join("</head>");
      fs.writeFileSync(indexHtmlPath, indexHtml, "utf-8");
      console.log("[INDEX.HTML] Deduplicated snippet to exactly 1 occurrence.");
    }
  } else {
    console.error("[INDEX.HTML] File not found at:", indexHtmlPath);
  }

  // 2. Audit /public/ads.txt
  if (fs.existsSync(adsTxtPath)) {
    const adsTxtContent = fs.readFileSync(adsTxtPath, "utf-8");
    if (adsTxtContent.includes(PUBLISHER_ID)) {
      console.log("[ADS.TXT] Official line verified in public/ads.txt.");
    } else {
      console.log("[ADS.TXT] Publisher ID missing in public/ads.txt. Updating...");
      fs.writeFileSync(adsTxtPath, `${OFFICIAL_ADS_TXT_LINE}\n`, "utf-8");
      console.log("[ADS.TXT] public/ads.txt updated successfully.");
    }
  } else {
    console.log("[ADS.TXT] public/ads.txt not found. Creating file...");
    const publicDir = path.join(rootDir, "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(adsTxtPath, `${OFFICIAL_ADS_TXT_LINE}\n`, "utf-8");
    console.log("[ADS.TXT] public/ads.txt created successfully.");
  }

  console.log("==========================================");
  console.log("[ADSENSE VERIFICATION PRE-CHECK COMPLETE]");
  console.log("==========================================");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  applyAdSenseVerification();
}
