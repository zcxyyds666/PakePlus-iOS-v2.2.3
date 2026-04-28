window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// ==UserScript==
// @name         PakePlus 全能优化脚本
// @namespace    http://pake.fun/
// @version      1.0
// @description  极致全屏去白边+请求缓存加速+链接拦截
// @author       PakePlus
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';
    // 【关键修复】环境检测：非浏览器环境直接退出，避免window未定义报错
    if (typeof window === 'undefined') return;

    console.log('🚀 [PakePlus] 增强脚本启动中...');

    // ==============================================
    // 配置区域
    // ==============================================
    const CONFIG = {
        CACHE_VERSION: 'V1.0', // 缓存版本（修改后清空旧缓存）
        IS_MAX_SCREEN: true,  // 是否强制全屏（去标题栏+去白边）
        IS_CACHE: true,       // 是否开启请求缓存
        IS_OPEN_LINK: true,   // 是否拦截外链（当前页打开）
        IS_PRELOAD: true      // 是否开启预加载
    };

    // ==============================================
    // 1. 终极全屏：强制去白边、去标题栏
    // ==============================================
    if (CONFIG.IS_MAX_SCREEN) {
        try {
            // Tauri 环境：最大化窗口 + 隐藏标题栏
            if (window.__TAURI__) {
                __TAURI__.window.getCurrent().maximize();
                __TAURI__.window.getCurrent().setDecorations(false);
            }
            // 浏览器环境：模拟全屏
            else {
                window.moveTo(0, 0);
                window.resizeTo(screen.width, screen.height);
            }

            // CSS 兜底：彻底清除所有留白
            const style = document.createElement('style');
            style.textContent = `
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    overflow: hidden !important;
                }
                #app, .container, .content {
                    width: 100% !important;
                    height: 100% !important;
                    overflow: auto !important;
                }
            `;
            document.documentElement.appendChild(style);
            console.log('✅ [PakePlus] 全屏覆盖完成');
        } catch (e) {
            console.warn('❌ [PakePlus] 全屏失败:', e);
        }
    }

    // ==============================================
    // 2. 请求缓存：GET 接口秒开加速
    // ==============================================
    if (CONFIG.IS_CACHE) {
        const CACHE_PREFIX = `PakeCache_${CONFIG.CACHE_VERSION}`;

        // 缓存 Fetch 请求
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            const url = args[0];
            // 只缓存 GET 请求
            if (args[1]?.method !== 'GET' && args[1]?.method) {
                return originalFetch.apply(this, args);
            }

            const cacheKey = `${CACHE_PREFIX}_${url}`;
            const cached = localStorage.getItem(cacheKey);

            // 缓存命中：直接返回本地数据
            if (cached) {
                console.log('⚡ [PakePlus] 缓存命中:', url);
                return new Response(new Blob([cached]), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 缓存未命中：请求后存入缓存
            const response = await originalFetch.apply(this, args);
            const data = await response.clone().text();
            try {
                localStorage.setItem(cacheKey, data);
            } catch (e) {
                console.warn('❌ [PakePlus] 缓存失败:', e);
            }
            return response;
        };

        // 缓存 XHR 请求
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (...args) {
            const method = args[0];
            const url = args[1];
            this._url = url;

            if (method === 'GET') {
                const cacheKey = `${CACHE_PREFIX}_${url}`;
                const cached = localStorage.getItem(cacheKey);

                if (cached) {
                    console.log('⚡ [PakePlus] 缓存命中:', url);
                    this.addEventListener('readystatechange', () => {
                        if (this.readyState === 4) {
                            Object.defineProperty(this, 'responseText', { value: cached, configurable: true });
                        }
                    });
                }
            }
            return originalXHROpen.apply(this, args);
        };

        // 【关键修复】修复XHR send重写的递归bug，正确保存原始方法
        const originalXHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function (...args) {
            this.addEventListener('load', () => {
                if (this.status === 200 && this._url) {
                    const cacheKey = `${CACHE_PREFIX}_${this._url}`;
                    try {
                        localStorage.setItem(cacheKey, this.responseText);
                    } catch (e) {
                        console.warn('❌ [PakePlus] XHR缓存失败:', e);
                    }
                }
            });
            return originalXHRSend.apply(this, args);
        };

        console.log('✅ [PakePlus] 请求缓存已开启');
    }

    // ==============================================
    // 3. 链接拦截：禁止新窗口，当前页打开
    // ==============================================
    if (CONFIG.IS_OPEN_LINK) {
        // 拦截 a 标签点击
        document.addEventListener('click', e => {
            const link = e.target.closest('a');
            if (link && link.target === '_blank') {
                e.preventDefault();
                window.location.href = link.href;
            }
        }, true);

        // 拦截 window.open
        window.open = function (url) {
            window.location.href = url;
        };

        console.log('✅ [PakePlus] 链接拦截已开启');
    }

    // ==============================================
    // 4. 预加载：页面加载完成提示
    // ==============================================
    if (CONFIG.IS_PRELOAD) {
        window.addEventListener('load', () => {
            console.log('🚀 [PakePlus] 页面预加载完成');
        });
    }
})();