import {createComponent, Field, FieldConfig, FieldValue, select, SelectField} from "@intermesh/goui";
import {SelectOption} from "./CustomFields.js";

export class TreeSelectField extends Field {
	public options: SelectOption[] = [];

	constructor() {
		super();

		this.cls = "flow";
		this.baseCls = "";
	}

	protected renderControl() {
		//empty
	}

	private createSelect(options:(SelectOption | {id: null, text: string})[], value:FieldValue = undefined) {
		let lbl = this.label;
		const count = this.items.count();
		if(count > 0) {
			lbl += " ("+(count + 1)+")";
		}

		return select({
			label: lbl,
			textRenderer: o => o.text,
			value,
			valueField: "id",
			options,
			listeners: {
				setvalue: ev => {
					this.onSelect(ev.newValue);
				}
			}
		})
	}

	protected onSelect(v:FieldValue) {

		if(v === null) {
			for(let i = this.items.count() -1; i > 0; i--) {
				this.items.removeAt(i);
			}
		}


		const opt = this.findSelectOption(v, this.options);
		if(!opt) {
			return;
		}
		for(let i = this.items.count() -1; i > opt.parents!.length; i--) {
			this.items.removeAt(i);
		}
		if(opt.children.length) {
			this.items.add(this.createSelect(opt.children));
		}
	}

	protected internalRender(): HTMLElement {

		this.items.add(this.createSelect([{id: null, text: "---"},...this.options]));

		return super.internalRender();
	}

	protected internalSetValue(v?: number) {
		super.internalSetValue(v);

		if(!v) {
			return;
		}

		const opt = this.findSelectOption(v, this.options);

		if(!opt) {
			return;
		}

		opt.parents?.forEach((o, index) => {
			const field = this.items.get(index) as SelectField;
			field.value = o.id;
		});

		(this.items.last() as SelectField).value = v;

	}

	protected internalGetValue(): FieldValue {
		const last = this.items.last() as SelectField|undefined;
		if(!last) {
			return undefined;
		}

		return last.value;
	}


	protected findSelectOption(optionId: FieldValue, options: SelectOption[], parents: SelectOption[] = []): SelectOption | undefined {
		if (!optionId) {
			return undefined;
		}

		let o;
		for (let i = 0, l = options.length; i < l; i++) {
			o = options[i];
			o.parents = parents;

			if (o.id == optionId) {
				return o;
			}

			if (o.children) {
				const nested = this.findSelectOption(optionId, o.children, [...parents, o]);
				if (nested) {
					return nested;
				}
			}
		}

		return undefined;
	}

}


/**
 * Shorthand function to create {@link TreeSelectField}
 *
 * @link https://goui.io/#form/Select Examples
 *
 * @param config
 */
export const treeselect = (config?: FieldConfig<TreeSelectField>) => createComponent(new TreeSelectField(), config);