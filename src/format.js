// this file will contain functions to format the output for the CLI tool using chalk for colors and styling. 
// It will export functions to print the header, each repository, and the footer.

import chalk from 'chalk';

function formatNumber(num){     // \u2B50 : unicode for star emoji
    if(num >= 1000) return chalk.yellow(`\u2B50 ${(num/1000).toFixed(1)}k`); // format 1000 as 1k
    return chalk.yellow(`\u2B50 ${num}`); // just return the number as it is
}

function truncate(str, maxLen) {
  if (!str) return chalk.gray("No description");
  return str.length > maxLen ? str.slice(0, maxLen - 3) + "..." : str;
}

function durationLabel(duration){
    const labels = {day: "today", week: "this week", month: "this month", year: "this year"};
    return labels[duration] || duration;
}

export function printHeader(duration, limit, totalFound, since){
    console.log("");
    console.log(
        chalk.bold.white("Trending GitHub Repositories") + chalk.gray(` - ${durationLabel(duration)}`)
    )
    console.log(
        chalk.gray(` Repos after ${since} - showing top ${limit} of ${totalFound.toLocaleString()} results\n`)
    );
    console.log(chalk.gray("─".repeat(70)));
}

export function printRepo(repo, index){
    const num = chalk.bold.gray(`${String (index+1).padStart(2)}.`); // pad the number to 2 digits for alignment
    const name = chalk.bold.green(repo.full_name);
    const stars = formatNumber(repo.stargazers_count);
    const lang = chalk.bold.gray(repo.language || "Unknown");
    const desc = truncate(repo.description, 72);
    const url = chalk.blue.underline(repo.html_url);
    
    console.log(`\n${num} ${name}`);
    console.log(`       ${desc}`);
    console.log(`       ${stars}     \u2022 ${lang}    \u{1F517} ${url}`);
}

export function printFooter(count){
    console.log("");
    console.log(chalk.gray("─".repeat(70)));
    console.log(chalk.gray(`   ${count} repositories displayed.`));
    console.log("");
    console.log("");
}