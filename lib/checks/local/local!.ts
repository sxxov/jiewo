export default macro = function local(node) {
	const {
		arguments: [arg0],
	} = node;
	if (!arg0) return;

	return arg0;
};
