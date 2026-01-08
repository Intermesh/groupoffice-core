import {modules} from "../Modules.js";
import {t} from "@intermesh/goui";
import {SystemSettingsPanel} from "./SystemSettingsPanel.js";
import {JmapDataSource} from "../jmap/index.js";

modules.addSystemSettingsPanel("core", "core", "customfields1", t("Custom fields"), "storage", () => {
	return new SystemSettingsPanel();
});

export const fieldsetDS = new JmapDataSource("FieldSet");

export const fieldDS = new JmapDataSource("Field");