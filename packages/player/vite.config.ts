import { execSync } from "node:child_process";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import jotaiDebugLabel from "jotai/babel/plugin-debug-label";
import jotaiReactRefresh from "jotai/babel/plugin-react-refresh";
import { defineConfig, type Plugin } from "vite";
import i18nextLoader from "vite-plugin-i18next-loader";
import lightningcss from "vite-plugin-lightningcss";
import svgr from "vite-plugin-svgr";
import wasm from "vite-plugin-wasm";
import { VitePWA } from "vite-plugin-pwa";

function getCommitHash() {
	try {
		return execSync("git rev-parse HEAD", { stdio: "pipe" })
			.toString("utf8")
			.trim();
	} catch (err) {
		console.warn("警告：获取 Git Commit Hash 失败", err);
		return "";
	}
}

function getBranchName() {
	try {
		return execSync("git branch --show-current", { stdio: "pipe" })
			.toString("utf8")
			.trim();
	} catch (err) {
		console.warn("警告：获取 Git Branch Name 失败", err);
		return "";
	}
}

const GitMetadataPlugin = (): Plugin => {
	const VIRTUAL_ID = "virtual:git-metadata-plugin";
	const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;
	let gitCommit = "";
	let gitBranch = "";
	return {
		name: "git-metadata-plugin",
		async buildStart() {
			const metadata = {
				commit: "",
				branch: "",
			};
			if (!gitCommit)
				try {
					gitCommit = getCommitHash();
				} catch (err) {
					console.warn("警告：获取 Git Commit Hash 失败", err);
				}
			if (!gitBranch)
				try {
					gitBranch = getBranchName();
				} catch (err) {
					console.warn("警告：获取 Git Branch Name 失败", err);
				}
			this.emitFile({
				fileName: "git-metadata.json",
				name: "git-metadata",
				needsCodeReference: false,
				source: JSON.stringify(metadata),
				type: "asset",
			});
		},
		resolveId(id) {
			if (id === VIRTUAL_ID) {
				return RESOLVED_VIRTUAL_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_ID) {
				return `export const commit = ${JSON.stringify(
					gitCommit,
				)};\nexport const branch = ${JSON.stringify(gitBranch)};`;
			}
		},
	};
};

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		headers: {
			"Cross-Origin-Embedder-Policy": "require-corp",
			"Cross-Origin-Opener-Policy": "same-origin",
		},
	},
	build: {
		target: "esnext",
		minify: "esbuild",
		modulePreload: {
			polyfill: false,
		},
		rollupOptions: {
			shimMissingExports: true,
			input: {
				index: resolve(__dirname, "index.html"),
			},
		},
		sourcemap: true,
	},
	plugins: [
		react({
			babel: {
				plugins: [jotaiDebugLabel, jotaiReactRefresh],
			},
		}),
		wasm(),
		svgr({
			svgrOptions: {
				ref: true,
			},
			include: ["./src/**/*.svg?react", "../react-full/src/**/*.svg?react"],
		}),
		lightningcss({
			browserslist: "safari >= 10.13, chrome >= 91",
		}),
		GitMetadataPlugin(),
		i18nextLoader({
			paths: ["./locales"],
			namespaceResolution: "basename",
		}),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "AMLL Player",
				short_name: "AMLL Player",
				description: "Apple Music Like Lyrics Player - 类苹果音乐歌词播放器",
				theme_color: "#000000",
				background_color: "#000000",
				display: "standalone",
				orientation: "portrait",
				scope: "/",
				start_url: "/",
				lang: "zh-CN",
				icons: [
					{
						src: "/pwa-192x192.png",
						sizes: "256x256",
						type: "image/png",
					},
					{
						src: "/pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "/pwa-maskable-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
				screenshots: [
					{
						src: "/screenshot-wide.png",
						sizes: "1280x720",
						type: "image/png",
						form_factor: "wide",
						label: "AMLL Player 桌面端界面",
					},
					{
						src: "/screenshot-narrow.png",
						sizes: "390x844",
						type: "image/png",
						form_factor: "narrow",
						label: "AMLL Player 移动端界面",
					},
				],
			},
			workbox: {
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
				globPatterns: ["**/*.{js,css,html,svg,png,ico,wasm,json}"],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "google-fonts-cache",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365,
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "gstatic-fonts-cache",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365,
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
			devOptions: {
				enabled: true,
			},
		}),
	],
	resolve: {
		dedupe: ["react", "react-dom", "jotai"],
		alias: {
			"@applemusic-like-lyrics/core": resolve(__dirname, "../core/src"),
			"@applemusic-like-lyrics/react": resolve(__dirname, "../react/src"),
			"@applemusic-like-lyrics/react-full": resolve(
				__dirname,
				"../react-full/src",
			),
		},
	},
	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	// server: {
	// 	port: 1420,
	// 	strictPort: true,
	// },
	// 3. to make use of `TAURI_DEBUG` and other env variables
	// https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
	envPrefix: ["VITE_"],
});
