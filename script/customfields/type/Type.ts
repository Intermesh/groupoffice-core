import {MaterialIcon} from "@intermesh/goui";
import {FieldDialog} from "../FieldDialog.js";

export abstract class Type {
	public name?: string;
	public icon?: MaterialIcon;
	public label?: string;

	protected constructor() {}

	abstract getDialog(): FieldDialog;
}