class data
{
    constructor()
    {
        this.kDefaultCountryIndex = 0;
        // The API's address; a build for a live site sets REACT_APP_API_URL (deploy/deploy.mjs)
        this.kDomain = process.env.REACT_APP_API_URL || 'http://localhost:8081/';
        this.kUserRole = 0;
        this.kOrganizerRole = 1;
        this.kAdminRole = 2;
        this.kDefaultRole = this.kUserRole;
        this.kMaxExpireTime = 2147483647;
        this.kUserVerified = 1;   
        this.kClientDomains = ['http://localhost:3000'];
        // The session secret and the database login are server-only: server/settings.js
    }

    GetValue(value) 
    {
        return value == undefined ? undefined : value;
    }
};

export let common = new data();