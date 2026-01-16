import {btn, checkbox, comp, mstbar, searchbtn, t, tbar} from "@intermesh/goui";
import {systemSettingsPanels} from "../SystemSettingsWindow.js";
import {AbstractSystemSettingsPanel} from "../AbstractSystemSettingsPanel.js";
import {GroupTable} from "./GroupTable.js";
import {CreateUserDialog} from "../users/CreateUserDialog.js";
import {GroupDialog} from "./GroupDialog.js";

class Main extends AbstractSystemSettingsPanel {
	private groupTbl: GroupTable;

	constructor() {
		super("groups", t("Groups"),"group");

		this.cls = "vbox fit";

		this.groupTbl = new GroupTable();

		this.items.add(
			tbar({cls: "border-bottom"},
				mstbar({
					table: this.groupTbl
				},
					"->",
					btn({
						icon: "delete",
						title: t("Delete"),
						handler: (btn) => {
							this.groupTbl.delete();
							btn.parent!.hide();
						}
					})
					),

				"->",
				searchbtn({
					listeners: {
						input: ({text}) => {
							this.groupTbl.store.setFilter("search", {text});
							void this.groupTbl.store.load();
						}
					}
				}),
				btn({
					text: t("Add"),
					cls: "primary filled",
					handler: (button, ev) => {
						const win = new GroupDialog();
						win.show();
					}
				}),

				),
			comp({
				flex: 1,
				cls: "scroll bg-lowest"
			},
				this.groupTbl
				)

		);
	}

	async load(): Promise<any> {
		return this.groupTbl.store.load();
	}

}

systemSettingsPanels.add(Main);
