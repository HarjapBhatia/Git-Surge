#!/usr/bin/env node

import chalk from 'chalk';
import { fetchTrendingRepos } from './src/api.js';
import { printHeader, printRepo, printFooter } from './src/format.js';
import { parseArgs } from './src/args.js';
import { getApiKey } from './src/config.js';
import { parseWithAI } from './src/ai.js';

async function main() {
    const args = parseArgs();

    let duration, limit;

    if(args.aiMode){
        const apiKey = await getApiKey();
        process.stdout.write(chalk.gray(`\nUnderstanding your query with AI...`));  
        try{
            const extracted = await parseWithAI(args.query, apiKey);
            duration = extracted.duration;
            limit = extracted.limit;
        }catch(err){
            console.error(chalk.red(`\nAI Error: ${err.message}\n`));
            process.exit(1);
        }

        console.log(chalk.gray(`    Interpreted: Duration: ${duration}, Limit: ${limit}\n`));
    }
    else{
        duration = args.duration;
        limit = parseInt(args.limit);
    }

    process.stdout.write(chalk.gray(`\n Fetching trending repos for the past ${duration}...`));

    let result;
    try {
        result = await fetchTrendingRepos(duration, limit);
    } catch(err){
        process.stdout.write("\r" + " ".repeat(60) + "\r"); // clear the loading message
        console.error(chalk.red(`Error: ${err.message}\n`));
        process.exit(1);
    }
    
    process.stdout.write("\r" + " ".repeat(60) + "\r");
    const {repos, totalFound, since} = result;

    if(repos.length === 0){
        console.log(chalk.yellow(`\nNo trending repositories found.\n`));
        process.exit(0);
    }

    printHeader(duration, limit, totalFound, since);
    repos.forEach((repo, index) => printRepo(repo, index));
    printFooter(repos.length);
}

main();