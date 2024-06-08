const fs = require("fs");
const path = require("path");

// Function to load a JSON file and parse its content
function loadJson(filePath) {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
}

// Function to recursively collect all keys in a JSON object
function collectKeys(obj, prefix = "") {
    let keys = [];
    for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);
        if (typeof obj[key] === "object" && obj[key] !== null) {
            keys = keys.concat(collectKeys(obj[key], fullKey));
        }
    }
    return keys;
}

// Function to compare the keys of two JSON objects
function compareJson(reference, target) {
    const referenceKeys = new Set(collectKeys(reference));
    const targetKeys = new Set(collectKeys(target));

    // Determine missing and extra keys
    const missingKeys = [...referenceKeys].filter(key => !targetKeys.has(key));
    const extraKeys = [...targetKeys].filter(key => !referenceKeys.has(key));

    return {
        isValid: missingKeys.length === 0 && extraKeys.length === 0,
        missingKeys,
        extraKeys
    };
}

// Define directories for reference and base path
const referenceDir = path.join("languages", "en");
const basePath = "languages";

try {
    // Read all directories in the base path
    const languages = fs.readdirSync(basePath);
    const errors = [];

    for (const language of languages) {
        // Skip the reference directory
        if (language === "en") continue;

        const languageDir = path.join(basePath, language);
        const files = fs.readdirSync(languageDir);

        for (const file of files) {
            if (file.endsWith(".json")) {
                const referenceFile = path.join(referenceDir, file);
                const targetFile = path.join(languageDir, file);

                if (!fs.existsSync(referenceFile)) {
                    // Log error if reference file does not exist
                    errors.push(`Reference file ${referenceFile} does not exist.`);
                    continue;
                }

                // Load JSON content from reference and target files
                const referenceJson = loadJson(referenceFile);
                const targetJson = loadJson(targetFile);

                // Compare the JSON content
                const {isValid, missingKeys, extraKeys} = compareJson(referenceJson, targetJson);

                // Log errors if the structure does not match
                if (!isValid) {
                    let errorMessage = `File ${targetFile} does not match the reference structure.`;
                    if (missingKeys.length) errorMessage += ` Missing keys: ${missingKeys.join(", ")}.`;
                    if (extraKeys.length) errorMessage += ` Extra keys: ${extraKeys.join(", ")}.`;
                    errors.push(errorMessage);
                }
            }
        }
    }

    // Log all errors and exit with code 1 if any discrepancies are found
    if (errors.length > 0) {
        console.error("Errors found:");
        errors.forEach(error => console.error(error));
        process.exit(1);
    } else {
        console.log("All files match the reference structure.");
    }
} catch (err) {
    // Log any unexpected errors and exit with code 1
    console.error(err);
    process.exit(1);
}