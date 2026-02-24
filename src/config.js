// this file handles, reading and storing Gemini API key in the user's home directory
// and exporting functions to get and delete the API key for use in AI mode 

import fs from 'fs';
import os from 'os';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';

const CONFIG_DIR = path.join(os.homedir(), '.git-surge');   // . creates a hidden directory in the user's home folder
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');   // this file will store the Gemini API key

function readConfig(){
    try{
        if(!fs.existsSync(CONFIG_FILE)) return null;   // if config file doesn't exist, return null
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(raw);   
    }catch { return null; }
}

function writeConfig(config){
    if(!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);   // create the config directory if it doesn't exist
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config), 'utf-8'); 
}

function askUser(){
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("");
        console.log(chalk.yellow('Gemini API key not found.'))
        console.log(chalk.yellow('Get a free API key at: https://aistudio.google.com'));
        console.log(chalk.yellow('Free tier: 1500 requests per day\n'));

        // .question() is used to prompt the user for input in cli
        // first arg is the question to display, second arg is a callback that receives the user's input
        rl.question(chalk.gray('Enter your Gemini API key: '), (key)=>{
            rl.close();
            resolve(key.trim());
        });  
    });
}

export async function getApiKey(){
    const config = readConfig();
    
    if(config?.geminiAPIKey) return config.geminiAPIKey;   // if API key exists in config, return it

    const key = await askUser();   // otherwise, ask the user for the API key
    if(!key) {
        console.error(chalk.red('\nNo API key entered. AI mode will not work without a Gemini API key.\n'));
        process.exit(1);
    }

    writeConfig({geminiAPIKey: key});   // save the API key
    console.log(chalk.green('\nAPI key saved successfully!\n'));
    return key;
}

export async function deleteAPIKey(){
    if(fs.existsSync(CONFIG_FILE)){
        const config = readConfig();
        delete config.geminiAPIKey;   // remove the API key from the config object
        writeConfig(config);
        console.log(chalk.green('\nAPI key deleted successfully!\n'));
    }else {
        console.log(chalk.yellow('\nNo API key found to delete.\n'));
    }
    process.exit(0);
}