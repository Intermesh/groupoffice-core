import {btn, checkbox, comp, mstbar, searchbtn, t, tbar} from "@intermesh/goui";
import {systemSettingsPanels} from "../SystemSettingsWindow.js";
import {AbstractSystemSettingsPanel} from "../AbstractSystemSettingsPanel.js";
import {UserTable} from "./UserTable.js";

class Main extends AbstractSystemSettingsPanel {
	private userTbl: UserTable;

	constructor() {
		super("users", t("Users"),"account_box");

		this.cls = "vbox fit";

		this.userTbl = new UserTable();

		this.items.add(
			tbar({cls: "border-bottom"},
				mstbar({
					table: this.userTbl
				},
					"->",
					btn({
						icon: "delete",
						title: t("Delete"),
						handler: (btn) => {
							this.userTbl.delete();
							btn.parent!.hide();
						}
					})
					),

				checkbox({
					type: "switch",
					label: t("Show inactive"),
					name: "showInactive",
					value: false,
					listeners: {
						change: ({newValue}) => {
							this.userTbl.store.setFilter("showDisabled", newValue ? {showDisabled: true} : undefined);
							void this.userTbl.store.load();
						}
					}
				}),
				"->",
				searchbtn({
					listeners: {
						input: ({text}) => {
							this.userTbl.store.setFilter("search", {text});
							void this.userTbl.store.load();
						}
					}
				}),
				btn({
					text: t("Add"),
					cls: "primary filled",
				}),

				),
			comp({
				flex: 1,
				cls: "scroll bg-lowest"
			},
				this.userTbl
				)

		);
	}

	async load(): Promise<any> {
		return this.userTbl.store.load();
	}

}

systemSettingsPanels.add(Main);
