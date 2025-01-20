import {modules} from "../Modules.js";
import {t} from "@intermesh/goui";
import {SystemSettingsPanel} from "./SystemSettingsPanel.js";

modules.addSystemSettingsPanel("core", "core", "customfields1", t("Custom fields"),"storage", () => {
	return new SystemSettingsPanel();
})