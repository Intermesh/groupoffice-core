function pointer(path:string) {
	const parts = path.split('/');
	// ignore leading / as it is implicit
	for(let i=0; i < parts.length; i++) {
		parts[i].replace('~1', '/')
					.replace('~0', '~');
	}
	return parts;
}

function set(doc: any, path: string[], v: any) {
	if(!doc) return; // skip patching item in non-existing objects
	if(path.length > 1) {
		set(doc[path.shift()!], path, v);
	} else {
		if (v === null) {
			delete doc[path[0]];
		} else {
			doc[path[0]] = v;
		}
	}
}

export function applyPatch(doc:any, patch: any) {
	for(const p in patch) {
		set(doc, pointer(p), patch[p]);
	}
	return doc; // the patched document
}