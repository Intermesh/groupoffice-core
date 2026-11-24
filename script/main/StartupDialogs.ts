import {comp, t, win, Window} from "@intermesh/goui";
import {client} from "../jmap/index.js";
import {modules} from "../Modules.js";
import {WelcomeWindow} from "./WelcomeWindow.js";

/**
 * Shows a modal window while the browser is offline, for example when the Wi-Fi is out of reach
 */
export function watchOnlineStatus() {
	let offlineWindow: Window | undefined;

	window.addEventListener('offline', () => {
		if(offlineWindow) {
			return;
		}
		offlineWindow = win({
				title: t("Browser is offline"),
				modal: true,
				closable: false,
				resizable: false,
				width: 400
			},
			comp({cls: "pad", text: t("Waiting for connection to return") + "..."})
		);
		offlineWindow.show();
	});

	window.addEventListener('online', () => {
		offlineWindow?.close();
		offlineWindow = undefined;
	});
}

/**
 * After the installation, shows the first administrator the welcome window with the system settings to go through and
 * the option to generate demo data
 *
 * @return The welcome window, when it is shown
 */
export function welcome(): WelcomeWindow | undefined {
	if(client.user.id != "1" || !client.user.isAdmin) {
		return undefined;
	}

	const coreMod = modules.get("core", "core");
	if(!coreMod || coreMod.settings.welcomeShown) {
		return undefined;
	}

	const w = new WelcomeWindow();
	w.show();
	return w;
}
