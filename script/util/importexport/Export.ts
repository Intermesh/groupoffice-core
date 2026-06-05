import {client, JmapDataSource} from "../../jmap/index.js";
import {t, Window} from "@intermesh/goui";
import {ColumnSelectDialog} from "./ColumnSelectDialog.js";
import {Entity} from "../../Entities.js";

export abstract class Export {
	public static toFile(entity: string, queryParams: Record<string, any>, extension: string) {
		if (extension == 'csv' || extension == 'xlsx' || extension == 'html') {
			const dlg = new ColumnSelectDialog(entity, extension);

			dlg.form.on("submit", ({target}) => {
				this.export(entity, queryParams, extension, target.value.columns);

				dlg.close();
			});

			dlg.show();
		} else {
			this.export(entity, queryParams, extension);
		}
	}

	private static export(entity: string, queryParams: Record<string, any>, extension: string, columns?:string[]) {
		client.jmap(entity + "/query", queryParams).then((result) => {
			client.jmap(entity + "/export", {
				extension: extension,
				ids: result.ids,
				columns: columns
			}).then((result) => {
				// document.location = client.downloadUrl(result.blobId);
				void Window.alert(t("Export in progress"), t("You will be notified when the export is complete. You can close this window now."));

			}).catch((result) => {
				Window.alert(result);
			})
		});
	}
}

export interface SpreadSheetExport extends Entity {
	id: string,
	name: string,
	entity: string,
	columns: string[],
	userId: string
}

export const spreadsheetExportDS = new JmapDataSource<SpreadSheetExport>("SpreadSheetExport");