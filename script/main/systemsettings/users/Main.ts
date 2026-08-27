import {btn, checkbox, comp, hr, menu, mstbar, searchbtn, t, tbar} from "@intermesh/goui";
import {systemSettingsPanels} from "../SystemSettingsWindow.js";
import {AbstractSystemSettingsPanel} from "../AbstractSystemSettingsPanel.js";
import {UserTable} from "./UserTable.js";
import {CreateUserDialog} from "./CreateUserDialog.js";
import {Import} from "../../../util/importexport/Import.js";
import {Export} from "../../../util/importexport/Export.js";
import {UserDefaultsWindow} from "./UserDefaultsWindow.js";

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
					icon: "add",
					text: t("Add"),
					cls: "primary filled",
					handler: (button, ev) => {
						const d = new CreateUserDialog();
						d.show();
					}
				}),

				btn({
					icon: "more_vert",
					menu: menu({},
						this.userTbl.getVisibleColumnButton(),
						'-',
						btn({
							icon: "user_attributes",
							text: t("User defaults"),
							handler: () => {
								const win = new UserDefaultsWindow();
								win.show();
							}
						}),
						'-',
						btn({
							icon: "cloud_upload",
							text: t("Import"),
							handler: () => {
								Import.fromFile(
									'User',
									'.csv, .xlsx, .json',
									{},
									{}
								);
							}
						}),
						btn({
							icon: "cloud_download",
							text: t("Export"),
							menu: menu({},
								btn({
									icon: "unknown_document",
									text: t("Microsoft Excel"),
									handler: () => {
										Export.toFile(
											'User',
											this.userTbl.store.queryParams,
											"xlsx");
									}
								}),
								btn({
									icon: "csv",
									text: "Comma Seperated Values",
									handler: () => {
										Export.toFile(
											'User',
											this.userTbl.store.queryParams,
											"csv");
									}
								}),
								btn({
									icon: "html",
									text: t("Web page") + " (HTML)",
									handler: () => {
										Export.toFile(
											'User',
											this.userTbl.store.queryParams,
											"html");
									}
								}),
								btn({
									icon: "text_snippet",
									text: "JSON",
									handler: () => {
										Export.toFile(
											'User',
											this.userTbl.store.queryParams,
											"json");
									}
								})
							)
						})
						)
				})

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
