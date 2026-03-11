import { Provider } from "jotai";
import { createRoot } from "react-dom/client";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "./App.tsx";
import "./i18n";
import "./styles.css";
import { registerSW, updateServiceWorker } from "./registerSW";

const ErrorRender = (props: FallbackProps) => {
	console.error(props.error);
	return (
		<div>
			<h2>An unrecoverable error has occured</h2>
			<code>
				<pre>
					{(props.error as Error).message}
					{(props.error as Error).stack}
				</pre>
			</code>
		</div>
	);
};

// 注册 PWA Service Worker
registerSW({
	onNeedRefresh: () => {
		// 检测到新版本时显示提示
		toast.info(
			() => (
				<div>
					<div>发现新版本，是否更新？</div>
					<button
						onClick={() => {
							updateServiceWorker();
							toast.dismiss("pwa-update");
						}}
						style={{
							marginTop: "8px",
							padding: "4px 12px",
							background: "#007bff",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
						}}
					>
						立即更新
					</button>
				</div>
			),
			{
				toastId: "pwa-update",
				autoClose: false,
				closeOnClick: false,
				draggable: false,
			}
		);
	},
	onOfflineReady: () => {
		// 应用可离线使用时提示
		console.log("App is ready for offline use");
	},
});

createRoot(document.getElementById("root") as HTMLElement).render(
	<ErrorBoundary fallbackRender={ErrorRender}>
		<Provider>
			<App />
		</Provider>
	</ErrorBoundary>,
);
