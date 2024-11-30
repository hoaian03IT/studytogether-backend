function blendArray(array) {
	const blended = [...array];
	const len = blended.length;

	for (let i = len - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = blended[i];
		blended[i] = blended[j];
		blended[j] = temp;
	}

	return blended;
}

module.exports = { blendArray };