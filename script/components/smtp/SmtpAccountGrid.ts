import {
	btn,
	column,
	createComponent,
	datasourcestore,
	DataSourceStore,
	menu,
	t,
	Table,
	TableConfig
} from "@intermesh/goui";
import {jmapds} from "../../jmap/index.js";
import {smtpaccountdialog} from "./SmtpAccountDialog.js";

interface Module {
	package: string,
	name: string
}

export class SmtpAccountGrid extends Table<DataSourceStore> {
	constructor(module?:Module) {
		super(
			datasourcestore({
				dataSource: jmapds("SmtpAccount"),
				filters: {
					module: {module: module}
				}
			}),
			[
				column({
					id: "hostname",
					header: t("Hostname")
				}),
				column({
					id: "fromEmail",
					header: t("E-mail")
				}),
				column({
					id: "btn",
					sticky: true,
					width: 32,
					renderer: (columnValue, record, td, table, storeIndex, column) => {
						return btn({
							icon: "more_vert",
							menu: menu({},
								btn({
									text: t("Edit"),
									icon: "edit",
									handler: async () => {
										const dlg = smtpaccountdialog({});
										await dlg.load(record.id);
										dlg.show();
									}
								}),
								btn({
									text: t("Delete"),
									icon: "delete",
									handler: () => {
										void jmapds("SmtpAccount").confirmDestroy([record.id]);
									}
								})
							)
						})
					}
				})
			]
		);

		this.on("rowdblclick", async (table,rowIndex,ev) => {
			const dlg = smtpaccountdialog({});

			await dlg.load(table.store.get(rowIndex)!.id);
			dlg.show();
		});
	}
}

export type SmtpAccountGridConfig = Omit<TableConfig<SmtpAccountGrid>, "store" | "columns"> & {
	module?:Module
}

export const smtpaccountgrid = (config?:SmtpAccountGridConfig) => createComponent(new SmtpAccountGrid(config?.module), config);