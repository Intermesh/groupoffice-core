import {comp, root, router, t, win, Window} from "@intermesh/goui";
import {client} from "../jmap/index.js";
import {modules, moduleDS} from "../Modules.js";

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
 * After the installation, asks the first administrator to go through the system settings, and at the next login
 * whether to generate demo data
 */
export async function welcome() {
	if(client.user.id != "1" || !client.user.isAdmin) {
		return;
	}

	const coreMod = modules.get("core", "core");
	if(!coreMod) {
		return;
	}

	if(!coreMod.settings.welcomeShown) {
		await Window.alert(t("Please complete the installation by running through the system settings. Click OK to continue to the system settings dialog."), t("Welcome!"));
		await moduleDS.update(coreMod.id, {settings: {welcomeShown: true}});
		void router.goto("systemsettings");
		return;
	}

	if(!coreMod.settings.demoDataAsked) {
		const generate = await Window.confirm(t("Do you want to generate some fake demonstration data? This will take about one or two minutes to generate."), t("Demo"));
		await moduleDS.update(coreMod.id, {settings: {demoDataAsked: true}});

		if(generate) {
			root.mask();
			try {
				client.raiseNextRequestTimeout(180000);
				await client.jmap("System/demo");
			} catch(e) {
				void Window.error(e);
			} finally {
				root.unmask();
			}
		}
	}
}
