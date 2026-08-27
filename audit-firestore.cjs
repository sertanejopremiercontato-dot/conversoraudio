const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, getDoc } = require("firebase/firestore");
const config = require("./firebase-applet-config.json");

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId || "(default)");

async function runAudit() {
  console.log("=== AUDITORIA FIRESTORE ===");
  
  // 1. Check site_settings
  console.log("\n--- Coleção site_settings ---");
  try {
    const siteSettingsSnap = await getDocs(collection(db, "site_settings"));
    siteSettingsSnap.forEach(d => {
      console.log(`Document ID: [${d.id}] Data:`, JSON.stringify(d.data()).substring(0, 300));
    });
  } catch (err) {
    console.error("Erro em site_settings:", err.message);
  }

  // 2. Check home_banners
  console.log("\n--- Coleção home_banners ---");
  try {
    const bannersSnap = await getDocs(collection(db, "home_banners"));
    console.log(`Total home_banners: ${bannersSnap.size}`);
    bannersSnap.forEach(d => {
      const data = d.data();
      console.log(`- Banner ID: [${d.id}] | Nome: ${data.name || data.title || "(sem nome)"} | Ativo: ${data.active !== false} | Local: ${data.placement || data.position}`);
    });
  } catch (err) {
    console.error("Erro em home_banners:", err.message);
  }

  // 3. Check ads
  console.log("\n--- Coleção ads ---");
  try {
    const adsSnap = await getDocs(collection(db, "ads"));
    console.log(`Total ads: ${adsSnap.size}`);
    adsSnap.forEach(d => {
      const data = d.data();
      console.log(`- Ad ID: [${d.id}] | Nome: ${data.name || data.title || "(sem nome)"} | Ativo: ${data.active !== false} | Pos: ${data.placement || data.position}`);
    });
  } catch (err) {
    console.error("Erro em ads:", err.message);
  }

  // 4. Check site_metrics
  console.log("\n--- Coleção site_metrics ---");
  try {
    const metricsSnap = await getDocs(collection(db, "site_metrics"));
    console.log(`Total site_metrics docs: ${metricsSnap.size}`);
    metricsSnap.forEach(d => {
      const data = d.data();
      console.log(`Doc [${d.id}] -> pageviews: ${data.pageviews || 0}, sessions: ${data.sessions || 0}, visitors: ${data.visitors || 0}, downloads: ${data.downloads || 0}, bannerImpressions:`, Object.keys(data.bannerImpressions || {}), "bannerClicks:", Object.keys(data.bannerClicks || {}));
    });
  } catch (err) {
    console.error("Erro em site_metrics:", err.message);
  }
}

runAudit().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
