import {client, JmapDataSource} from "../../jmap/index.js";
import {BaseEntity, browser, t, Window} from "@intermesh/goui";
import {CsvMappingDialog} from "./CsvMappingDialog.js";

export abstract class Import {
	public static async importFile(entity: string, accept: string, values: Record<string, any>, options: Record<string, any>) {
		const files = await browser.pickLocalFiles(true, undefined, accept);

		const blobs = await client.uploadMultiple(files);

		blobs.forEach(blob => {
			if (blob.name.toLowerCase().slice(-3) === 'csv' || blob.name.toLowerCase().slice(-4) === 'xlsx') {
				const dlg = new CsvMappingDialog(
					entity,
					blob.name,
					blob.id,
					values,
					options.fields || {},
					options.aliases || {},
					options.lookupFields || {id: "ID"}
				);

				dlg.show();
			} else {
				client.jmap(entity + "/import", {
					blobId: blob.id,
					values: values
				}).then((result) => {
					Window.alert(t("Importing is in progress in the background. You will be kept informed about progress via notifications."), t("Success"));
				}).catch((error) => {
					Window.error(error);
				})
			}
		});

	}
}

export interface importMapping extends BaseEntity {
	mappingId?: string,
	name: string,
	columnMapping: Record<string, any>,
	dateFormat: string,
	timeFormat: string,
	decimalSeparator: string,
	thousandsSeparator: string,
	updateBy: string
}

export const importMappingDS = new JmapDataSource<importMapping>("ImportMapping");