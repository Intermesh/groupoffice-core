import {JmapDataSource} from "../jmap/index.js";

export * from './CustomFields.js';
export * from './TreeSelectField.js';
export * from './Types.js';
export * from './FormFieldset.js';
export * from './FieldSetDialog.js';
export * from './FieldDialog.js';
export * from './ExportDialog.js';
export * from './EntityPanel.js';
export * from './EntityDialog.js';
export * from './DetailFieldset.js';



export const fieldsetDS = new JmapDataSource("FieldSet");

export const fieldDS = new JmapDataSource("Field");