import {btn, column, comp, containerfield, p, store, Store, t, Table, tbar, win, Window} from "@intermesh/goui";
import {moduleDS, modules} from "../../Modules.js";
import {SharePanel} from "../../permissions/index.js";
import {entities, Entity} from "../../Entities.js";
import {systemSettingsPanels} from "./SystemSettingsWindow.js";
import {AbstractSystemSettingsPanel} from "./AbstractSystemSettingsPanel.js";
import {client} from "../../jmap/index.js";

type Record = Entity & {
	moduleId: string;
	moduleTitle: string;
}

export class DefaultPermissionsTable extends Table<Store<Record>> {
	constructor() {
		// Get all entities that support ACL ownership
		const data = entities.getAll()
			.filter(e => e.isAclOwner)
			.map(e => {
				const module = modules.get(e.package, e.module)!;

				if(!module) {
					debugger;
				}
				return {
					...e,
					moduleId: module.id,
					moduleTitle: module.title
				};
			});

		console.log(data);

		const entityStore = store<Record>({
			data: data,
			sort: [{property: 'title', isAscending: true}]
		});

		const columns = [
			column({
				id: 'title',
				header: t('Name'),
				sortable: true,
				resizable: true
			}),
			column({
				id: 'moduleTitle',
				header: t('Module'),
				sortable: true,
				resizable: true
			}),
			column({
				id: 'actions',
				width: 180,
				align: "right",
				sortable: false,
				htmlEncode: false,
				renderer: (_v, _record) => {
					return btn({
						icon: "edit",
						handler: () => this.edit(_record)
					})
				}
			})
		];

		super(entityStore, columns);

		this.fitParent = true;

		this.on("rowdblclick", ({storeIndex}) => {
			this.edit(this.store.get(storeIndex) as Record);
		});


	}

	private edit(record: Record) {
		const w = new DefaultPermissionsWindow(record);

		w.show();
	}
}

class DefaultPermissionsPanel extends AbstractSystemSettingsPanel {
	constructor() {
		super("defaultpermissions", t("Default permissions"), "share");

		this.cls = "vbox fit";
		this.items.add(
			p({text: t("Select an entity to manage the default permissions when new items are created."), cls:"pad"}),
			comp({cls: "scroll bg-lowest", flex: 1},
				new DefaultPermissionsTable()
			));

	}
}

class DefaultPermissionsWindow extends Window {
	private sharePanel: SharePanel;
	constructor(record: Record) {
		super();

		this.modal = true;
		this.title = t('Set default permissions') + " - " + record.title;
		this.width = 700;
		this.height = 600;

		this.resizable = true;

		this.sharePanel = new SharePanel();
		this.sharePanel.flex = 1;
		this.sharePanel.setEntity(record.name, record.defaultAclId);
		this.sharePanel.load();

		this.items.add(
			this.sharePanel,
			tbar({cls: "border-top"},

				btn({
					text: t("Add to all"),
					handler: async () => {
						if(!await Window.confirm(t("Are you sure you want to add the default groups to all items? WARNING: This can't be undone."))) {
							return;
						}

						await this.save(record);
						await this.reset(record, true);

					}
				}),


				btn({
					text: t("Reset all"),
					handler: async () => {
						if(!await Window.confirm(t("Are you sure you want to reset all permissions? WARNING: This can't be undone."))) {
							return;
						}

						await this.save(record);
						await this.reset(record, false);

					}
				}),

				"->",


				btn({
					cls: "filled primary",
					text: t("Save"),
					handler: async() => {
						await this.save(record)
						this.close();
					}

				})
			)
		);


	}

	private async reset(record:Record, add:boolean) {
		this.mask();
		try {
			return client.jmap("share/Acl/reset", {
				add,
				entity: record.name
			})
		} catch(e) {
			void Window.error(e);
		}	finally {
			this.unmask();
		}
	}

	private async save(record:Record) {
		this.mask();
		try {
			return moduleDS.update(record.moduleId, {["entities/" + record.name + "/defaultAcl"]: this.sharePanel.value})
		} catch(e) {
			void Window.error(e);
		}	finally {
			this.unmask();
		}
	}
}

systemSettingsPanels.add(DefaultPermissionsPanel);
