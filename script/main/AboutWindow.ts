import {a, comp, fieldset, Format, p, t, textfield, Window} from "@intermesh/goui";
import {client} from "../jmap/index.js";

/**
 * The response of System/about
 */
interface About {
	version: string
	/**
	 * Set when the server checks for updates and a newer release exists
	 */
	latestVersion: string | null
	/**
	 * Only for administrators
	 */
	usage?: {
		users: number
		fileStorage: number
		database: number
		mailbox: number
		quota: number | null
		calculatedAt: string | null
	}
}

/**
 * Shows the version, whether an update is available and, to administrators, the usage of this instance
 *
 * The "hideAbout" config option hides it for users that aren't administrators.
 */
export class AboutWindow extends Window {
	private readonly version;

	constructor() {
		super();

		this.title = t("About");
		this.cls = "about";

		this.items.add(
			comp({cls: "about-groupoffice-logo"}),
			this.version = p(),
			a({href: "https://www.group-office.com", target: "_blank", text: "www.group-office.com"})
		);

		this.setVersion(client.session!.version);

		this.on("render", () => {
			void this.load();
		});
	}

	private setVersion(version: string, latestVersion: string | null = null) {
		let html = Format.escapeHTML(version);
		if(latestVersion) {
			html += ` <span class="success">(${t("update available")}: ${Format.escapeHTML(latestVersion)})</span>`;
		}

		// The key with line breaks is the one that is translated
		this.version.html = t("Version: {version}<br/>\nCopyright (c) 2003-{current_year}, {company_name}<br/>\nAll rights reserved.")
			.replace("{version}", html)
			.replace("{current_year}", String((new Date).getFullYear()))
			.replace("{company_name}", "Intermesh");
	}

	private async load() {
		const about = await client.jmap("core/System/about") as About;

		this.setVersion(about.version, about.latestVersion);

		if(!about.usage) {
			return;
		}

		const u = about.usage, field = (label: string, value: string) => textfield({label, value, readOnly: true});

		this.items.insert(2, fieldset({
				title: t("This instance is using")
			},
			field(t("Users"), String(u.users)),
			field(t("Files"), Format.fileSize(u.fileStorage) + " / " + (u.quota ? Format.fileSize(u.quota) : "-")),
			field(t("Database"), Format.fileSize(u.database)),
			field(t("E-mail"), u.mailbox ? Format.fileSize(u.mailbox) : "-"),
			field(t("Total"), Format.fileSize(u.fileStorage + u.database + u.mailbox)),
			field(t("Date"), u.calculatedAt ? Format.smartDateTime(u.calculatedAt) : t("Never"))
		));
	}
}
