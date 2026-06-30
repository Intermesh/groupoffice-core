import {
	btn,
	column, comp,
	Component,
	datasourcestore,
	EntityID, Fieldset,
	h4,
	hr,
	menu,
	menucolumn,
	mstbar,
	t,
	table,
	tbar
} from "@intermesh/goui";

import {JmapDataSource} from "../../../../jmap/index.js";
import {OauthClientDialog} from "./OauthClientDialog.js";

export const oauthClientDS = new JmapDataSource("OauthClient");

/*
@deprocated - the GOUI System settings will use Settings instead
 */
export class OauthClients extends Fieldset {

	constructor() {
		super();

		this.legend = t("Oauth clients")
		this.cls = "vbox";

		const store = datasourcestore({
			dataSource: oauthClientDS,
			sort: [{property: "name", isAscending: true}]
		});

		const tbl = table({
			flex: 1,
			cls: "bg-lowest",
			store,
		 	rowSelectionConfig: {
				multiSelect: true
		 	},
			listeners: {
				delete: async () =>  {
					const ids = tbl.rowSelection!.getSelected()!.map(row => row.record.id);
					await oauthClientDS.confirmDestroy(ids);
				},
				rowdblclick: async ({storeIndex}) => {
					this.edit(store.get(storeIndex)!.id);
				},
				render: () => {
					void store.load();
				}
			},
			columns: [
				column({
					id: "id",
					resizable: true,
					header: t("ID"),
					sortable: true,
					hidden: true
				}),
				column({
					id: "name",
					resizable: true,
					header: t("Name"),
					sortable: true
				}),

				column({
					id: "identifier",
					resizable: true,
					header: t("Identifier"),
					sortable: true
				}),

				column({
					id: "redirectUri",
					resizable: true,
					header: t("Redirect URI"),
					sortable: true
				}),

				menucolumn({
					menu: menu({},
						btn({
							text: t("Edit"),
							icon: "edit",
							handler: (b) => {
								const book = tbl.store.get(b.parent!.dataSet.rowIndex)!;
								this.edit(book.id);
							}
						}),
						hr(),
						btn({
							icon: "delete",
							text: t("Delete"),
							handler: async (b) => {
								const book = tbl.store.get(b.parent!.dataSet.rowIndex)!;
								void oauthClientDS.confirmDestroy([book.id]);
							}
						})
					)
				})
			]
		})

		this.items.add(

			comp({cls: "card vbox"},
				tbar({cls: "bg-low border-bottom"},
					'->',

					btn({
						cls: "primary filled",
						icon: "add",
						text: t("Add"),
						handler: async () => {
							this.edit();
						}
					}),

					mstbar({table: tbl},
						"->",
						btn({
							icon: "delete",
							handler: async (btn) => {

								tbl.delete();
								btn.parent!.hide();

							}
						})
					)
				),
				tbl
			),


		);
	}

	private edit(id?: EntityID) {
		const dlg = new OauthClientDialog();
		dlg.show();
		if (id) {
			void dlg.load(id);
		}
		return dlg;
	}

	onSubmit() {
	}
}