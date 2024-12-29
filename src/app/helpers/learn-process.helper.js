class LearnProcessHelper {
	/**
	 * Helper function to generate screens for a word
	 */
	static generateScreens(word, examples, learnt, notLearn, optionalScreen = false, timer = false) {
		const combined = learnt.concat(notLearn);
		const wordOptions = combined.map(({ word }) => word);
		const definitionOptions = combined.map(({ definition }) => definition);

		const screens = [
			{
				template: "multiple-choice",
				wordId: word?.["word id"],
				question: word.word,
				answer: word.definition,
				options: definitionOptions,
				image: word.image,
				duration: timer ? 6 : null,
				pronunciation: word?.pronunciation,
			},
			{
				template: "multiple-choice",
				wordId: word?.["word id"],
				question: word.definition,
				answer: word.word,
				options: wordOptions,
				image: word.image,
				duration: timer ? 6 : null,
				pronunciation: word?.pronunciation,
			},
			{
				template: "text",
				wordId: word?.["word id"],
				question: word.definition,
				answer: word.word,
				image: word.image,
				duration: timer ? 10 : null,
				pronunciation: word?.pronunciation,
			},
		];

		// Optional screens
		if (optionalScreen) {
			screens.push({
				template: "definition",
				wordId: word?.["word id"],
				word: word.word,
				definition: word.definition,
				pronunciation: word.pronunciation,
				transcript: word.transcription,
				image: word.image,
				type: word.type,
				examples,
			});

			if (word?.pronunciation) {
				screens.push(
					{
						template: "text",
						wordId: word?.["word id"],
						question: "",
						answer: word.word,
						pronunciation: word.pronunciation,
						image: word.image,
						duration: timer ? 10 : null,
					},
					{
						template: "multiple-choice",
						wordId: word?.["word id"],
						question: "",
						answer: word.word,
						options: wordOptions,
						pronunciation: word.pronunciation,
						image: word.image,
						duration: timer ? 6 : null,
					},
				);
			}
		}

		return screens;
	}
}

module.exports = { LearnProcessHelper };
