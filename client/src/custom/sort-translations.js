const fs = require('fs');
const path = require('path');

// Languages to exclude
const excludedLangs = []; // like ['ar', 'en', 'th']

// Read all language directories
const localesDir = path.join('..', 'locales');
const langDirs = fs.readdirSync(localesDir)
  .filter(dir => fs.statSync(path.join(localesDir, dir)).isDirectory())
  .filter(dir => !excludedLangs.includes(dir));

console.log('Will sort keys in translation.json for the following languages:');
console.log(langDirs.join(', '));

// Sort keys for each language
langDirs.forEach(lang => {
  const translationFile = path.join(localesDir, lang, 'translation.json');
  
  try {
    // Read translation.json file
    const content = fs.readFileSync(translationFile, 'utf8');
    const translations = JSON.parse(content);
    
    // Sort keys alphabetically
    const sortedTranslations = {};
    Object.keys(translations).sort().forEach(key => {
      sortedTranslations[key] = translations[key];
    });
    
    // Write the file back
    fs.writeFileSync(
      translationFile,
      JSON.stringify(sortedTranslations, null, 2),
      'utf8'
    );
    
    console.log(`✅ Successfully sorted keys in ${lang}/translation.json`);
  } catch (error) {
    console.error(`❌ Error sorting keys in ${lang}/translation.json:`, error.message);
  }
});

console.log('Finished sorting keys in translation.json for all languages');