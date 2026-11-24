import {comp, t, win, Window} from "@intermesh/goui";
import {client, jmapds} from "../jmap/index.js";
import {modules} from "../Modules.js";
import {WelcomeWindow} from "./WelcomeWindow.js";
import {ChangelogRelease, WhatsNewWindow} from "./WhatsNewWindow.js";

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

/**
 * Shows administrators the changes since the version they saw last
 *
 * The seen version is stored on the user (whatsNewVersion), so they don't see the same changes again on another
 * device. When it isn't set yet, like after the upgrade that brought this window, it takes the version before the last
 * upgrade from the core setting "upgradedFrom". The version counts as seen when the window closes, so a reload before
 * that shows it again.
 */
export async function whatsNew() {
	if(!client.user.isAdmin || !client.session) {
		return;
	}

	const version = client.session.version;

	const store = () => {
		void jmapds("User").update(client.user.id, {whatsNewVersion: version}).catch(e => {
			// It shows again at the next login
			console.warn("Could not save the seen version of What's new", e);
		});
	};

	// A new administrator gets the tour, not the changes of the past
	const since: string | undefined = client.user.whatsNewVersion ??
		((client.user.loginCount ?? 0) > 1 ? modules.get("core", "core")?.settings.upgradedFrom : undefined);

	if(since == version) {
		return;
	}

	if(!since) {
		store();
		return;
	}

	let result: {releases: ChangelogRelease[]};
	try {
		result = await client.jmap("core/System/changelog", {since});
	} catch(e) {
		// Not worth an error for the administrator. It tries again at the next login.
		console.warn("Could not load the changelog", e);
		return;
	}

	if(!result.releases.length) {
		store();
		return;
	}

	const w = new WhatsNewWindow(result.releases);
	w.on("close", store);
	w.show();
}
