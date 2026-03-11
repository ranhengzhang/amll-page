// PWA Service Worker 注册文件
// 由 vite-plugin-pwa 自动生成和管理

interface SWRegistrationOptions {
	onNeedRefresh?: () => void;
	onOfflineReady?: () => void;
}

let swRegistration: ServiceWorkerRegistration | null = null;

export function registerSW(options: SWRegistrationOptions = {}) {
	if ("serviceWorker" in navigator) {
		window.addEventListener("load", async () => {
			try {
				const registration = await navigator.serviceWorker.register("/sw.js");
				swRegistration = registration;
				console.log("SW registered: ", registration);

				// 监听新的 Service Worker 安装
				registration.addEventListener("updatefound", () => {
					const newWorker = registration.installing;
					if (newWorker) {
						newWorker.addEventListener("statechange", () => {
							// 当新的 SW 安装完成并等待激活时
							if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
								console.log("New version available");
								options.onNeedRefresh?.();
							}
						});
					}
				});

				// 检查是否离线可用
				if (registration.active) {
					options.onOfflineReady?.();
				}
			} catch (error) {
				console.error("SW registration failed: ", error);
			}
		});

		// 监听 controller 变化（更新生效时）
		navigator.serviceWorker.addEventListener("controllerchange", () => {
			console.log("New service worker activated, reloading...");
			window.location.reload();
		});
	}
}

// 跳过等待，立即激活新的 Service Worker
export async function updateServiceWorker() {
	if (swRegistration?.waiting) {
		// 发送消息给 SW 跳过等待
		swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
	}
}

// 检查更新
export async function checkForUpdates() {
	if (swRegistration) {
		await swRegistration.update();
	}
}
