import {
	btn,
	checkbox,
	column,
	comp,
	datasourcestore,
	datecolumn,
	DataSourceStore,
	fieldset,
	Fieldset,
	form,
	hr,
	menu,
	menucolumn,
	p,
	t,
	table,
	Table,
	tbar,
	textfield,
	Window,
	win, Component, h3
} from "@intermesh/goui";
import {JmapDataSource} from "../../jmap/index.js";
import {client} from "../../jmap/index.js";
import {User} from "../../auth/index.js";

export type AppPassword = {
	id: string,
	userId: string,
	label: string,
	scopes: { protocol: string }[],
	createdAt: string,
	lastUsedAt?: string,
	lastUsedIp?: string,
	secret?: string
}

export const appPasswordDS = new JmapDataSource<AppPassword>("AppPassword");

const protocols = [
	{value: "dav", text: "WebDAV, CalDAV, CardDAV"},
	{value: "activesync", text: "Microsoft ActiveSync"}
];

/**
 * Fieldset in the account settings to manage the app passwords of a user.
 *
 * Only the user itself can create app passwords as the secret is shown once to the creator. Admins can see and delete
 * the app passwords of other users.
 */
export class AppPasswords extends Component {
	private readonly store: DataSourceStore<JmapDataSource<AppPassword>, AppPassword>;
	private readonly tbl: Table;
	private readonly addBtn;
	private userId?: string;

	constructor() {
		super();

		this.hidden = true;
		this.cls = "card";

		this.store = datasourcestore({
			dataSource: appPasswordDS,
			sort: [{property: "createdAt", isAscending: false}]
		});

		this.tbl = table({
			store: this.store,
			cls: "bg-lowest",
			columns: [
				column({
					id: "label",
					header: t("Label"),
					sortable: true
				}),
				column({
					id: "scopes",
					header: t("Protocols"),
					width: 200,
					renderer: (v: { protocol: string }[]) => (v || []).map(s => s.protocol).join(", ")
				}),
				datecolumn({
					id: "createdAt",
					header: t("Created"),
					sortable: true,
					width: 160
				}),
				datecolumn({
					id: "lastUsedAt",
					header: t("Last used"),
					sortable: true,
					width: 160
				}),
				column({
					id: "lastUsedIp",
					header: t("Last used IP"),
					sortable: true,
					width: 140
				}),
				menucolumn({
					menu: menu({},
						btn({
							icon: "delete",
							text: t("Delete"),
							handler: async (b) => {
								const record = this.store.get(b.parent!.dataSet.rowIndex)!;
								const confirmed = await Window.confirm(t("Are you sure you want to delete this password? This cannot be undone."));
								if (confirmed) {
									void appPasswordDS.destroy(record.id);
								}
							}
						})
					)
				})
			]
		});

		this.items.add(
			h3(t("App passwords")),
			p(t("Use app passwords to let apps like WebDAV, CalDAV, CardDAV and ActiveSync log in without your regular password.")),
			tbar({},
				this.addBtn = btn({
					icon: "add",
					text: t("New app password"),
					cls: "filled",
					handler: () => {
						new AppPasswordDialog().show();
					}
				})
			),
			comp({cls: "scroll", style: {maxHeight: "20rem"}}, this.tbl)
		);
	}

	public async load(user: User) {
		this.userId = user.id + "";
		const own = user.id == client.user.id;

		this.addBtn.hidden = !own;
		this.hidden = !(own || client.user.isAdmin);

		if (!this.hidden) {
			this.store.queryParams.filter = {user: this.userId};
			await this.store.load();
		}
	}
}

/**
 * Dialog to create a new app password. Shows the generated secret once after saving.
 */
class AppPasswordDialog extends Window {
	constructor() {
		super();

		this.title = t("New app password");
		this.width = 440;
		this.modal = true;
		this.maximizable = false;
		this.resizable = false;

		const dav = checkbox({label: protocols[0].text, name: "dav", value: true}),
			activesync = checkbox({label: protocols[1].text, name: "activesync", value: false}),
			label = textfield({name: "label", label: t("Label"), required: true});

		this.items.add(
			form({
					cls: "vbox",
					handler: async () => {
						const scopes = [];
						if (dav.value) {
							scopes.push({protocol: "dav"});
						}
						if (activesync.value) {
							scopes.push({protocol: "activesync"});
						}

						const created = await appPasswordDS.create({
							userId: client.user.id + "",
							label: label.value,
							scopes
						});

						// Don't keep the secret in the data source cache.
						const secret = created.secret;
						delete created.secret;

						this.close();
						showSecret(secret!);
					}
				},
				fieldset({},
					label,
					comp({cls: "vbox"},
						p(t("Protocols")),
						dav,
						activesync
					)
				),
				tbar({},
					"->",
					btn({type: "submit", text: t("Save"), cls: "filled primary"})
				)
			)
		);

		this.on("show", () => label.focus());
	}
}

const showSecret = (secret: string) => {
	const copyBtn = btn({
		icon: "content_copy",
		text: t("Copy"),
		handler: async () => {
			await navigator.clipboard.writeText(secret);
			copyBtn.text = t("Copied!");
			setTimeout(() => copyBtn.text = t("Copy"), 2000);
		}
	});

	const w = win({
			title: t("App password created"),
			modal: true,
			closable: false,
			width: 440
		},
		comp({cls: "pad vbox"},
			p(t("Copy this password now. You won't be able to see it again.")),
			textfield({
				value: secret,
				readOnly: true,
				style: {fontFamily: "monospace", fontSize: "1.2rem", textAlign: "center"}
			}),
			hr()
		),
		tbar({},
			"->",
			copyBtn,
			btn({text: t("Close"), cls: "filled primary", handler: () => w.close()})
		)
	);

	w.show();
};
