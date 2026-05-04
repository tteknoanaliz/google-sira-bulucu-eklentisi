let isOpen = true;
let isScanning = false;

function createSidePanel(targetSite) {
    if (document.getElementById("teknoanaliz-container")) {
        document.getElementById("panel-target-name").innerText = targetSite;
        return;
    }

    const container = document.createElement("div");
    container.id = "teknoanaliz-container";
    container.style = "position:fixed; top:150px; right:20px; z-index:9999; transition:right 0.5s ease; display:flex; align-items:flex-start;";

    container.innerHTML = `
        <div id="teknoanaliz-toggle" style="background:#4285f4; color:white; padding:10px 5px; cursor:pointer; border-radius:8px 0 0 8px; font-weight:bold; writing-mode:vertical-rl; font-size:11px;">
            ${isOpen ? 'KAPAT ❯' : '❮ AÇ'}
        </div>
        <div id="teknoanaliz-panel" style="background:#1e1e1e; border:1px solid #333; border-radius:0 12px 12px 12px; padding:15px; width:220px; font-family:sans-serif; color:white; box-shadow:0 4px 15px rgba(0,0,0,0.5);">
            <h3 id="panel-target-name" style="margin:0 0 10px 0; font-size:13px; color:#4285f4; border-bottom:1px solid #333; padding-bottom:5px;">${targetSite}</h3>
            
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
                <span>📍 Mevcut Sayfa:</span> <span id="panel-page">-</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
                <span>📊 Bu Sayfada:</span> <span id="panel-rank">-</span>
            </div>
            
            <button id="deepScanBtn" style="width:100%; margin-top:10px; padding:8px; background:#34a853; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size:11px;">
                🔍 Diğer Sayfaları Tara (1-5)
            </button>

            <div id="deepResult" style="margin-top:10px; font-size:12px; color:#fbbc05; text-align:center; display:none; border:1px solid #444; padding:5px; border-radius:4px;">
                Taranıyor...
            </div>

            <div id="panel-time" style="font-size:10px; color:#777; text-align:center; margin-top:10px;">Taranıyor...</div>
        </div>
    `;
    document.body.appendChild(container);

    document.getElementById("teknoanaliz-toggle").addEventListener("click", () => {
        isOpen = !isOpen;
        container.style.right = isOpen ? "20px" : "-242px";
        document.getElementById("teknoanaliz-toggle").innerHTML = isOpen ? "KAPAT ❯" : "❮ AÇ";
    });

    document.getElementById("deepScanBtn").addEventListener("click", runDeepScan);
}

// Derin Tarama Mantığı (Page 2, 3, 4, 5)
async function runDeepScan() {
    if (isScanning) return;
    isScanning = true;
    
    const btn = document.getElementById("deepScanBtn");
    const resultBox = document.getElementById("deepResult");
    const target = (await chrome.storage.local.get(['targetSite'])).targetSite || "teknoanaliz.com.tr";
    const query = new URLSearchParams(window.location.search).get("q");

    btn.innerText = "⏳ Tarama Yapılıyor...";
    btn.disabled = true;
    resultBox.style.display = "block";
    resultBox.innerText = "Sayfalar kontrol ediliyor...";

    let foundInfo = "Maalesef ilk 5 sayfada yok.";

    for (let p = 1; p <= 4; p++) { // p=1 (2.sayfa), p=2 (3.sayfa)...
        resultBox.innerText = `${p + 1}. Sayfa taranıyor...`;
        const start = p * 10;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}`;
        
        try {
            const response = await fetch(searchUrl);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const titles = Array.from(doc.querySelectorAll("h3"));

            for (let i = 0; i < titles.length; i++) {
                const link = titles[i].closest("a");
                if (link && link.href.toLowerCase().includes(target)) {
                    foundInfo = `🎯 Bulundu! \n${p + 1}. Sayfa, ${i + 1}. Sıra`;
                    p = 5; // Döngüden çık
                    break;
                }
            }
            // Google'ı kızdırmamak için kısa bir bekleme
            await new Promise(r => setTimeout(r, 800)); 
        } catch (err) {
            foundInfo = "Tarama engellendi (Hız limitine takıldı).";
            break;
        }
    }

    resultBox.innerText = foundInfo;
    btn.innerText = "🔍 Derin Tarama Tekrarla";
    btn.disabled = false;
    isScanning = false;
}

function scanGoogle() {
    if (typeof chrome === "undefined" || !chrome.runtime?.id) return;

    chrome.storage.local.get(['targetSite'], (data) => {
        const target = data.targetSite || "teknoanaliz.com.tr";
        createSidePanel(target);

        const resultTitles = Array.from(document.querySelectorAll("#search h3"));
        let webRank = -1;

        for (let i = 0; i < resultTitles.length; i++) {
            const link = resultTitles[i].closest("a");
            if (link && link.href.toLowerCase().includes(target)) {
                webRank = i + 1;
                break; 
            }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const page = Math.floor((urlParams.get("start") || 0) / 10) + 1;

        const stats = { page, rank: webRank, timestamp: new Date().toLocaleTimeString('tr-TR') };
        chrome.storage.local.set({ lastResult: stats });

        document.getElementById('panel-page').innerText = page;
        const rankEl = document.getElementById('panel-rank');
        rankEl.innerText = webRank > 0 ? webRank + ". Sıra" : "Yok";
        rankEl.style.color = webRank > 0 ? "#00e676" : "#ff5252";
        document.getElementById('panel-time').innerText = "Güncel: " + stats.timestamp;
    });
}

setInterval(scanGoogle, 2000);