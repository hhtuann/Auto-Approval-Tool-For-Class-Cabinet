// page.js

(function () {
    'use strict';

    const API_PREFIX = "https://gwdu.ptit.edu.vn/slink/khai-bao-minh-chung/ban-can-su";
    let lastResults = [];

    // ====== Ant Design style notify ======
    function antNotify(message, type = "success") {
        const colors = {
            success: "#52c41a",
            error: "#f5222d",
            warning: "#faad14",
            info: "#1677ff"
        };

        const iconSVG = {
            success: `
                <svg viewBox="64 64 896 896" width="1.15em" height="1.15em" fill="currentColor">
                    <path d="M512 64C264.6 64 64 264.6 64 512s200.6
                    448 448 448 448-200.6 448-448S759.4 64 512
                    64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7
                    0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2
                    0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3
                    15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4
                    6.5 12.7z"></path>
                </svg>
            `,
            error: `
                <svg viewBox="64 64 896 896" width="1.15em" height="1.15em" fill="currentColor">
                    <path d="M512 64C264.6 64 64 264.6 64 512s200.6
                    448 448 448 448-200.6 448-448S759.4 64
                    512 64zm165.4 618.2l-47.2 47.2L512
                    559.7l-118.2 118.2-47.2-47.2L464.3
                    512 346.6 394.2l47.2-47.2L512
                    464.3l118.2-118.2 47.2 47.2L559.7
                    512l118.2 118.2z"></path>
                </svg>
            `,
            info: `
                <svg viewBox="64 64 896 896" width="1.15em" height="1.15em" fill="currentColor">
                    <path d="M512 64C264.6 64 64 264.6 64 512s200.6
                    448 448 448 448-200.6 448-448S759.4 64
                    512 64zm32 632c0 4.4-3.6 8-8
                    8h-48c-4.4 0-8-3.6-8-8V472c0-4.4
                    3.6-8 8-8h48c4.4 0 8 3.6
                    8 8v224zm-32-296a48 48 0 110-96 48
                    48 0 010 96z"></path>
                </svg>
            `,
            warning: `
                <svg viewBox="64 64 896 896" width="1.15em" height="1.15em" fill="currentColor">
                    <path d="M930.4 777.7L557.3 155c-7.4-12.3-20.4-19.7-34.8-19.7s-27.4
                    7.4-34.8 19.7L93.6 777.7A39.9 39.9 0 0088
                    798c0 22.1 17.9 40 40 40h768c6.9 0 13.4-1.8
                    19.1-5a39.8 39.8 0 0014.9-54.3zM512
                    402c17.7 0 32 14.3 32 32v192c0 17.7-14.3
                    32-32 32s-32-14.3-32-32V434c0-17.7 14.3-32
                    32-32zm0 344a48 48 0 110-96 48
                    48 0 010 96z"></path>
                </svg>
            `
        };

        const wrapper = document.createElement("div");
        wrapper.className = "ant-message ant-message-top";

        wrapper.style.top = "16px";
        wrapper.style.left = "50%";
        wrapper.style.position = "fixed";

        wrapper.style.opacity = "0";
        wrapper.style.transform = "translate(-50%, -26px)";
        wrapper.style.transition = "opacity 0.28s ease, transform 0.28s ease";
        wrapper.style.zIndex = "999999";

        wrapper.innerHTML = `
            <div class="ant-message-notice-wrapper">
                <div class="ant-message-notice ant-message-notice-${type}">
                    <div class="ant-message-notice-content">
                        <div class="ant-message-custom-content ant-message-${type}"
                            style="background:#fff;padding:12px 16px;border-radius:4px;
                            box-shadow:0 1px 25px rgba(0,0,0,.25);display:inline-flex;
                            align-items:center; gap:8px;font-size:14px;color:rgba(0,0,0,.85);">
                            <span style="color:${colors[type]}; display:inline-flex;">
                                ${iconSVG[type] || iconSVG.success}
                            </span>
                            <span>${message}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(wrapper);

        requestAnimationFrame(() => {
            wrapper.style.opacity = "1";
            wrapper.style.transform = "translate(-50%, 0)";
        });

        setTimeout(() => {
            wrapper.style.transform = "translate(-50%, -12px)";
            wrapper.style.opacity = "0";

            setTimeout(() => wrapper.remove(), 500);
        }, 2500);
    }

    // ====== Helpers ======
    function getToken() {
        return new Promise((resolve, reject) => {
            try {
                const data = sessionStorage.getItem(
                    'oidc.user:https://gwdu.ptit.edu.vn/sso/realms/ptit:ptit-connect'
                );
                if (!data) return reject("Không tìm thấy dữ liệu OIDC");

                const token = JSON.parse(data).access_token;
                if (!token) return reject("Không tìm thấy access_token");

                resolve(token);
            } catch (e) {
                reject(e);
            }
        });
    }

    function findButtonByText(label) {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn =>
            btn.textContent.replace(/\s+/g, ' ').trim() === label
        );
    }

    function reloadList() {
        const reloadBtn = findButtonByText('Tải lại');
        if (reloadBtn) reloadBtn.click();
    }

    // ====== Tạo nút ======
    function createButton() {
        if (document.getElementById("approveAllBtn")) return;

        const addBtn = findButtonByText('Thêm mới');
        if (!addBtn) {
            setTimeout(createButton, 1000);
            return;
        }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css";
        document.head.appendChild(link);

        const approveBtn = addBtn.cloneNode(true);
        approveBtn.id = "approveAllBtn";

        approveBtn.innerHTML = `<i class="bx bx-check-circle bxr" style="font-size:16px; vertical-align:middle;"></i> Duyệt tất cả`;

        approveBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            approveAll();
        };

        addBtn.parentNode.insertBefore(approveBtn, addBtn.nextSibling);
    }

    // ====== Duyệt tất cả ======
    async function approveAll() {
        let token;
        try {
            token = await getToken();
        } catch (e) {
            antNotify("Lỗi lấy token: " + e, "error");
            return;
        }

        const pending = lastResults.filter(x => x.trangThai !== "Duyệt");
        if (!pending.length) {
            antNotify("Không có minh chứng cần duyệt", "info");
            return;
        }

        let success = 0, fail = 0;

        for (const item of pending) {
            try {
                const res = await fetch(`${API_PREFIX}/${item._id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ trangThai: "Duyệt" })
                });
                res.ok ? success++ : fail++;
            } catch {
                fail++;
            }
        }

        antNotify(`Duyệt xong: ${success} thành công, ${fail} thất bại`, "success");
        reloadList();
    }

    // ====== Hook fetch ======
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const res = await originalFetch.apply(this, args);
        handleFetchResponse(args[0], res.clone());
        return res;
    };

    // ====== Hook XHR ======
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._url = url;
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
        this.addEventListener("load", function () {
            handleXHRResponse(this._url, this.responseText);
        });
        return originalSend.apply(this, arguments);
    };

    function handleFetchResponse(url, response) {
        try {
            if (!url || !url.includes("/slink/khai-bao-minh-chung/ban-can-su/page")) return;
            response.json().then(processData).catch(() => { });
        } catch { }
    }

    function handleXHRResponse(url, text) {
        try {
            if (!url || !url.includes("/slink/khai-bao-minh-chung/ban-can-su/page")) return;
            processData(JSON.parse(text));
        } catch { }
    }

    function processData(data) {
        if (data?.data?.result && Array.isArray(data.data.result)) {
            lastResults = data.data.result;
            console.log("Đã lấy danh sách minh chứng:", lastResults);
            createButton();
        }
    }

})();
