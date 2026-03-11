// PWA Service Worker 注册文件
// 由 vite-plugin-pwa 自动生成和管理

export function registerSW() {
	if ("serviceWorker" in navigator) {
		window.addEventListener("load", () => {
			navigator.serviceWorker
				.register("/sw.js")
				.then((registration) => {
					console.log("SW registered: ", registration);
				})
				.catch((registrationError) => {
					console.log("SW registration failed: ", registrationError);
				});
		});
	}
}

// 监听 PWA 更新
export function listenForUpdates(onUpdate: () => void) {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.addEventListener("controllerchange", () => {
			onUpdate();
		});
	}
}
