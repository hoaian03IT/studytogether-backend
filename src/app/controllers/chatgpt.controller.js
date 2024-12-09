const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(
  {
    apiKey: process.env.OPENAI_API_KEY, // Ensure API key is set correctly
  }
);

class ChatGPTController {

  async generateExampleAndExplanation(req, res) {
    const { word, sourceLanguage, targetLanguage } = req.body;

    if (!word || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({ error: "Word, sourceLanguage, and targetLanguage are required" });
    }

    try {
     
    //   const examplePrompt = `Provide 3 example sentences using the word "${word}" in ${targetLanguage}.`;
      
    //   const exampleResponse = await openai.createCompletion({
    //     model: "text-davinci-003",
    //     prompt: 'Give me name of cars',
    //     max_tokens: 100,
    //     temperature: 0.7,
    //   });
      
    //   console.log(exampleResponse);
    //   const examples = exampleResponse.data.choices[0]?.text
    //     ?.split("\n")
    //     ?.map((line) => line.trim())
    //     ?.filter((line) => line);

    //   if (!examples || examples.length === 0) {
    //     throw new Error("Failed to generate examples");
    //   }

      
    //   const explanationPrompt = `Provide simple explanations for the following sentences in ${sourceLanguage}: ${examples.join(
    //     ", "
    //   )}`;

    //   const explanationResponse = await openai.createChatCompletion(
    // {model: "gpt-3.5-turbo", // Hoặc "gpt-4"
    //   messages: [
    //     { role: "system", content: "You are a helpful assistant." },
    //     { role: "user", content: "Provide 3 example sentences using the word 'dog' in English." },
    //   ],
    //   max_tokens: 100,
    //   temperature: 0.7,});

    //   const explanations = explanationResponse.data.choices[0]?.text
    //     ?.split("\n")
    //     ?.map((line) => line.trim())
    //     ?.filter((line) => line);

    //   if (!explanations || explanations.length === 0) {
    //     throw new Error("Failed to generate explanations");
    //   }

    //   res.status(200).json({
    //     word,
    //     example: examples,
    //     explain: explanations,
    //   });

    const exampleResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Provide 3 example sentences using the word "${word}" in ${targetLanguage}.`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });
    console.log(exampleResponse);
    
    } catch (error) {
      console.error("Error generating example and explanation:", error)
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
}

module.exports = new ChatGPTController();
