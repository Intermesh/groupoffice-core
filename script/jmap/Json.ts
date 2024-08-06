function pointer(path:string) {
	const parts = path.replace(/^\//, "").split('/');
	// ignore leading / as it is implicit
	for(let i=0; i < parts.length; i++) {
		parts[i].replace('~1', '/')
			.replace('~0', '~');
	}
	return parts;
}

function set(doc: any, path: string[], v: any): any {

	const part = path.shift()!,
		length = path.length;

	if(!(part in doc) && length > 0) {
		throw new Error('patching item in non-existing objects')
	}

	if(!length) {
		doc[part] = v;
	} else {
		doc[part] = set(doc[part], path, v);
	}
	return doc;
}

export function applyPatch(doc:any, patch: any) {
	for(const p in patch) {
		doc = set(doc, pointer(p), patch[p]);
	}
	return doc; // the patched document
}