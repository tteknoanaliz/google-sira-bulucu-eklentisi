document.addEventListener('DOMContentLoaded', function() {
    const siteInput = document.getElementById('siteInput');
    const saveBtn = document.getElementById('saveBtn');
    const statusMsg = document.getElementById('statusMsg');

    // Mevcut hedefi yükle
    chrome.storage.local.get(['targetSite'], (data) => {
        if (data.targetSite) {
            siteInput.value = data.targetSite;
        }
    });

    // Yeni hedefi kaydet
    saveBtn.addEventListener('click', () => {
        const newSite = siteInput.value.trim().toLowerCase();
        if (newSite) {
            chrome.storage.local.set({ targetSite: newSite }, () => {
                // Alert yerine inline bildirim
                statusMsg.innerText = "Ayarlar Güncellendi ✅";
                
                // 2 saniye sonra yazıyı temizle
                setTimeout(() => {
                    statusMsg.innerText = "";
                }, 2000);
            });
        }
    });

    // UI Güncelleme (Aynı kaldı)
    function updateUI() {
        chrome.storage.local.get(['lastResult', 'targetSite'], (data) => {
            const res = data.lastResult;
            document.getElementById('currentSite').innerText = data.targetSite || "teknoanaliz.com.tr";
            
            if (res) {
                document.getElementById('page').innerText = res.page;
                const rankEl = document.getElementById('rank');
                if (res.rank > 0) {
                    rankEl.innerText = res.rank + ". Sıra";
                    rankEl.className = "val found";
                } else {
                    rankEl.innerText = "Yok";
                    rankEl.className = "val not-found";
                }
                document.getElementById('time').innerText = "Son Güncelleme: " + res.timestamp;
            }
        });
    }

    setInterval(updateUI, 1000);
    updateUI();
});