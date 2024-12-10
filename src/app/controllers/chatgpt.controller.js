// const { Configuration, OpenAIApi } = require("openai");

// // Khởi tạo cấu hình OpenAI
// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY, // Đảm bảo đã đặt API key trong file .env
// });

// // Tạo instance của OpenAIApi
// const openai = new OpenAIApi(configuration);

// class ChatGPTController {
//   // Hàm tạo ví dụ và giải thích
//   async generateExampleAndExplanation(req, res) {
//     const { word, sourceLanguage, targetLanguage } = req.body;

//     if (!word || !sourceLanguage || !targetLanguage) {
//       return res.status(400).json({ error: "Word, sourceLanguage, and targetLanguage are required" });
//     }

//     try {
//       // Prompt tạo ví dụ
//       const examplePrompt = `Provide 3 example sentences using the word "${word}" in ${targetLanguage}.`;

//       const exampleResponse = await openai.createCompletion({
//         model: "text-davinci-003",
//         prompt: examplePrompt,
//         max_tokens: 200,
//         temperature: 0.7,
//       });

//       const examples = exampleResponse.data.choices[0]?.text
//         ?.split("\n")
//         ?.map((line) => line.trim())
//         ?.filter((line) => line);

//       if (!examples || examples.length === 0) {
//         throw new Error("Failed to generate examples");
//       }

//       // Prompt tạo giải thích
//       const explanationPrompt = `Provide simple explanations for the following sentences in ${sourceLanguage}: ${examples.join(
//         ", "
//       )}`;

//       const explanationResponse = await openai.createCompletion({
//         model: "text-davinci-003",
//         prompt: explanationPrompt,
//         max_tokens: 300,
//         temperature: 0.7,
//       });

//       const explanations = explanationResponse.data.choices[0]?.text
//         ?.split("\n")
//         ?.map((line) => line.trim())
//         ?.filter((line) => line);

//       if (!explanations || explanations.length === 0) {
//         throw new Error("Failed to generate explanations");
//       }

//       res.status(200).json({
//         word,
//         example: examples,
//         explain: explanations,
//       });
//     } catch (error) {
//       console.error("Error generating example and explanation:", error);
//       res.status(500).json({
//         error: "Internal server error",
//         details: error.message,
//       });
//     }
//   }
// }

// module.exports = new ChatGPTController();
