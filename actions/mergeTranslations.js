const fs = require("fs").promises;
const path = require("path");

const languagesPath = path.join(__dirname, "..", "languages");
const publicPath = path.join(__dirname, "..", "public");

// Merge translations
(async () => {
    // Delete the public directory and recreate it
    await fs.rm(publicPath, {recursive: true});
    await fs.mkdir(publicPath);

    // Read the list of languages
    const languages = await fs.readdir(languagesPath);

    // Iterate through each language
    for (const language of languages) {
        // Get the path to the language directory
        const languagePath = path.join(languagesPath, language);

        // Read the list of files in the language directory
        const files = await fs.readdir(languagePath);

        // Iterate through each file in the language directory
        for (const file of files) {
            // Get the path to the translation file
            const filePath = path.join(languagePath, file);

            // Import the translations from the file
            const translations = await require(filePath);

            // Extract the filename without extension
            const filename = path.basename(file, ".json");

            // Construct the path to the corresponding public file
            const publicFilePath = path.join(publicPath, `${filename}.json`);

            let publicFile;
            try {
                // Read the existing public file
                publicFile = JSON.parse(await fs.readFile(publicFilePath, 'utf-8'));
            } catch (error) {
                // If the file doesn't exist, initialize an empty object
                publicFile = {};
            }

            // Add the translations for the current language
            publicFile[language] = translations;

            // Write the updated public file back to disk
            await fs.writeFile(publicFilePath, JSON.stringify(publicFile, null, 4));
        }
    }
})();