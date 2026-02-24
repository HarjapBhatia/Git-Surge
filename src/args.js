// this file parse the cli arguments using commander and export the parsed options to index.js
// also has a --reset-key option to delete the stored Gemini API key for AI mode

import { Command } from 'commander';
import { deleteAPIKey } from './config.js';

const validDurations = ['day', 'week', 'month', 'year'];

export function parseArgs() {
    const program = new Command();
    program
        .name('git-surge')
        .description('Fetch and display trending GitHub repositories')
        .option(
            "-d, --duration <duration>",    
            "Time range: day, week, month, year",
            "week"  // default 
        )
        .option(
            "-l, --limit <number>",
            "Number of repositories to display",
            "10"  // default
        )
        .option(
            '--reset-key',
            'Remove your Gemini API key and enter a new one'
        )
        .addHelpText(   // an example section to the --help text
            'after',
            `
            Examples (Normal Mode):
            $ git-surge --duration day --limit 5
            $ git-surge -d month -l 20
            $ git-surge -d year -l 15

            Examples (AI Mode):
            $ git-surge "show me 10 trending repos from last month"
            $ git-surge "top 5 repos today"
            $ git-surge "give me 25 repos from this year"

            Other:
            $ git-surge --reset-key   # to reset your Gemini API key for AI mode
            `
        );

    program.parse();
    
    const obj = program.opts(); // created an object with the parsed options

    const query = program.args[0]; // if user provided a natural language query

    if(obj.resetKey) deleteAPIKey(); // if --reset-key flag is provided, delete the stored Gemini API key and exit

    if(query){
        return {aiMode: true, query}; // if a query is provided, we are in AI mode, return the query for processing in index.js
    }
    
    // validate duration
    const duration = obj.duration.toLowerCase();
    if (!validDurations.includes(duration)) {
        console.error(`\nInvalid duration: ${obj.duration}. Valid options are: ${validDurations.join(', ')}\n`);
        process.exit(1);
    }

    // validate limit
    const limit = parseInt(obj.limit, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
        console.error(`\nInvalid limit: ${obj.limit}. Please provide a number between 1 and 100.\n`);
        process.exit(1);
    }

    return { aiMode:false, duration, limit };
}