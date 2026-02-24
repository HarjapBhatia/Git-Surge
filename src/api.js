// this file will contain functions to interact with the GitHub API and fetch trending repositories based on the specified duration and limit.

const durationDays = {
    day: 1,
    week: 7,
    month: 30,
    year: 365
};

function dateCutoff(duration) {
    const days = durationDays[duration];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return cutoffDate.toISOString().split('T')[0]; // formatting as YYYY-MM-DD
}

// GitHub doesn't have an official trending endpoint, so we search for repos created after a date cutoff and sort by stars.
export async function fetchTrendingRepos(duration, limit) {
    const since = dateCutoff(duration);
    const perPage = Math.min(limit, 100); // GitHub API max perPage limit is 100

    const url = new URL('https://api.github.com/search/repositories');
    // trick for query parameters for the search API
    url.searchParams.append('q', `created:>${since}`);
    url.searchParams.append('sort', 'stars');
    url.searchParams.append('order', 'desc');
    url.searchParams.append('per_page', perPage);

    let response;
    try{
        response = await fetch(url.toString(),{
            headers:{
                Accept: 'application/vnd.github.v3+json',   // specify the response/json format we want from GitHub
                "User-Agent": 'Git-Surge-CLI'  
            }
        });
    }catch(networkError){
        throw new Error(
            `Network error - are you connected to the internet?\n Details: ${networkError.message}`
        );
    }

    if (!response.ok) {
        if(response.status === 403){    // github rate limit error (gh sends 60 req/hr, else throws 403)
            throw new Error(
                `GitHub API rate limit exceeded.\n Please try again later or authenticate with a token for higher limits.`
            );
        }
        if(response.status === 422){    // validation error (e.g. invalid query params)
            throw new Error(
                `GitHub API rejected the request (422).\n The date range may be too broad. Try a shorter --duration.`
            );
        }
        throw new Error(    // any other API error
            `GitHub API error: ${response.status} ${response.statusText}\n Please try again later.`
        );
    }

    let data;
    try{
        data = await response.json();
    } catch{
        throw new Error(
            `Failed to parse GitHub API response.\n`
        );
    }

    if(!data.items || !Array.isArray(data.items)){
        throw new Error(    // github always returns an 'items' array for search results, if it's missing something is wrong with the response
            `Unexpected GitHub API response format.\n The API may have changed or is returning an error message.`
        );
    }

    return {
        // just in case the API returns more than we asked for, we slice it to the limit and sort it by stars again to ensure correct order 
        repos: data.items.slice(0, limit).sort((a, b) => b.stargazers_count - a.stargazers_count), 
        totalFound: data.total_count,  
        since, 
    }
}