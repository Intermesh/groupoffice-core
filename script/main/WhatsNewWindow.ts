import {a, btn, comp, Component, h3, small, t, tbar, Window} from "@intermesh/goui";

/**
 * A release in the changelog, as returned by core/System/changelog
 */
export interface ChangelogRelease {
	version: string
	/**
	 * dd-mm-yyyy
	 */
	date: string
	/**
	 * Lines like "Calendar: Events can be dragged"
	 */
	changes: string[]
}

/**
 * Shows administrators the changes of the releases since the version they saw last
 *
 * The changelog is in English and written for administrators, so only they get this window.
 */
export class WhatsNewWindow extends Window {

	constructor(releases: ChangelogRelease[]) {
		super();

		this.title = t("What's new");
		this.cls = "whats-new vbox";
		this.width = 720;
		this.height = 600;
		this.modal = true;
		this.resizable = true;
		this.maximizable = true;

		this.items.add(
			comp({flex: 1, cls: "scroll pad"},
				...releases.map(r => this.createRelease(r))
			),
			tbar({cls: "border-top"},
				a({
					cls: "normal-link",
					href: "https://github.com/Intermesh/groupoffice/blob/master/CHANGELOG.md",
					target: "_blank",
					text: t("Full changelog")
				}),
				"->",
				btn({
					cls: "filled primary",
					text: t("Close"),
					handler: () => this.close()
				})
			)
		);
	}

	private createRelease(release: ChangelogRelease): Component {
		return comp({cls: "whats-new-release"},
			comp({cls: "hbox gap whats-new-version"},
				h3(release.version),
				small(release.date)
			),
			comp({tagName: "ul"},
				...release.changes.map(c => this.createChange(c))
			)
		);
	}

	/**
	 * A change with the module in bold, like "<b>Calendar</b>: Events can be dragged". The text is set as text, not HTML.
	 */
	private createChange(change: string): Component {
		const li = comp({tagName: "li"}),
			match = change.match(/^([^:]{1,40}):\s(.*)$/s);

		if(match) {
			li.items.add(
				comp({tagName: "strong", text: match[1]}),
				comp({tagName: "span", text: ": " + match[2]})
			);
		} else {
			li.text = change;
		}

		return li;
	}
}
