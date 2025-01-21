import {MaterialIcon} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";

export abstract class Type {
	abstract name: string;
	public icon?: MaterialIcon;
	public label?: string;

	protected constructor() {
	}

	abstract getDialog(): FieldDialog;
}