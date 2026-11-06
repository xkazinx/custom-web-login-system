import express from 'express';
import mysql from 'mysql2/promise';
import session from 'express-session'   ;
import cors from 'cors';
import { common } from '../common/common.mjs';
import { v4 as uuid } from 'uuid';
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { settings } from './settings.js';

const app = express();
// Behind Caddy (kazin.dev) the request's scheme comes in X-Forwarded-Proto
app.set('trust proxy', 1);

app.use(session({
    secret: settings.sessionSecret,
    resave: true,
    saveUninitialized: true,
    cookie: { httpOnly: true, secure: 'auto', sameSite: 'lax' }
}));

const whitelist = settings.clientDomains || common.kClientDomains;
const corsOptions = {
  credentials: true, // This is important.
  origin: (origin, callback) => {
    if(whitelist.includes(origin))
      return callback(null, true)

      callback(new Error('Not allowed by CORS'));
  }
}

app.use(cors(corsOptions));
app.use(bodyParser.json())
app.use(cookieParser())

// The database login comes from the settings file (server/settings.js)
const { connectionLimit, ...db_auth } = settings.database;

async function dbConnection()
{
    return await mysql.createConnection(db_auth);
}

function GetUserFromResult(qres)
{
    return {
        email: qres[0].email,
        sessionId: qres[0].sessionId,
        firstName: qres[0].firstName,
        lastName: qres[0].lastName,
        role: qres[0].role,
        id: qres[0].id,
        verified: qres[0].verified
    };
}

let _sessions = [];

async function GetUser(sessionId, req) 
{
    const idx = _sessions.indexOf(sessionId);
    if(idx >= 0) {
        return _sessions[sessionId];
    }

    let user = null;
    let db = await dbConnection();
    let [qres, fields] = await db.execute("SELECT id FROM `sessions` WHERE sessionId = ?;"
        , [sessionId]
    );
    
    if(qres.length > 0) {

        let [user_qres, fields] = await db.execute("SELECT * FROM `users` WHERE id = ?;"
            , [qres[0].id]
        );

        user = GetUserFromResult(user_qres);
        user.sessionId = sessionId;

        _sessions[sessionId] = user;

        req.session.session_id = sessionId;
        req.session.user_id = user_qres[0].id;
    }

    await db.end();
    return user;
}

app.post('/entry', async (req, res) => {
    let { countryIdx, sessionId, userId } = req.body;

    let guest = sessionId == -1 || userId == -1;

    if(countryIdx == -1) {
        countryIdx = common.kDefaultCountryIndex;
    }

    if(!guest)
    {
        console.log("/entry: user is not guest, selecting from db...");
    
        let db = await dbConnection();

        let userId = -1;
        {
            let [qres, fields] = await db.execute("SELECT id FROM `sessions` WHERE sessionId = ?;",
                [sessionId]);

            // #todo can there be duplicate sessionIds?
            for(let i = 0; i < qres.length; ++i) {
                userId = qres[0].id;
                break;
            }
        }

        if(userId != -1) {
            let [qres, fields] = await db.execute("SELECT * FROM `users` WHERE id = ?;",
                [userId]);

            if(qres.length > 0) {

                req.session.session_id = sessionId;
                req.session.user_id = qres[0].id;

                console.log("/entry: found user!");
                
                let user = GetUserFromResult(qres);

                await db.end();

                return res.json({
                    countryIdx: countryIdx,
                    user: user
                });
            }
        }
    }
    else
    {
        console.log("/entry: guest logged in")
    }
    
    return res.json({
        countryIdx: countryIdx,
        user: null
    });
});

app.post('/signin/action', async (req, res) => {

    if(req.session.session_id && req.session.user_id)
    {
        let user = await GetUser(req.session.session_id, req);
        if(user) {
            return res.json({
                user: user
            });
        }
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(401).end();
    }

    let errors = {};

    if(email.length < 5) {
        errors.email = 1;
    }

    if(password.length < 8) {
        errors.password = 1;
    }

    if(Object.keys(errors).length > 0) {
        return res.json({ errors: { ...errors } });    
    }

    let db = await dbConnection();

    let [qres, fields] = await db.execute("SELECT * FROM `users` WHERE email = ?;",
        [email]);

    if(qres.length == 0)
    {
        errors.email = 2;
        return res.json({ errors: { ...errors } });   
    }

    // #todo encrypt
    const expectedPassword = qres[0].password;
    if (!expectedPassword || expectedPassword !== password) {
        errors.password = 2;
        db.end();
        return res.json({ errors: { ...errors } });   
    }

    const sessionId = uuid()

    req.session.session_id = sessionId;
    req.session.user_id = qres[0].id;

    console.log("/signin/action " + req.session.session_id);
    console.log("/signin/action " + req.session.user_id);

    const user = GetUserFromResult(qres);

    _sessions[sessionId] = user;

    await db.execute("INSERT INTO `sessions` (id, sessionId) VALUES (?, ?);",
        [user.id, user.sessionId]);

    await db.end();

    return res.json({
        user: user
    });
});

var emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

function isEmailValid(email) {
    if (!email)
        return false;

    if(email.length>254)
        return false;

    var valid = emailRegex.test(email);
    if(!valid)
        return false;

    // Further checking of some things regex can't handle
    var parts = email.split("@");
    if(parts[0].length>64)
        return false;

    var domainParts = parts[1].split(".");
    if(domainParts.some(function(part) { return part.length>63; }))
        return false;

    return true;
}

app.post('/register/action', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if(req.session.session_id && req.session.user_id)
    {
        let user = await GetUser(req.session.session_id, req);
        if(user) {
            return res.status(401).end();
        }
    }

    let errors = {};
    
    if(!firstName || !lastName || !email || !password)
        return res.status(401).end();

    // #todo validate entries
    if(firstName.length == 0) {
        errors.firstName = 1;
    }

    if(lastName.length == 0) {
        errors.lastName = 1;
    }

    if(!isEmailValid(email)) {
        errors.email = 1;
    }

    if(password.length < 8) {
        errors.password = 1;
    }

    if(Object.keys(errors).length > 0) {
        return res.json({ errors: { ...errors } });    
    }
    
    let db = await dbConnection();

    {
        let [qres, fields] = await db.execute("SELECT id FROM `users` WHERE email = ?;",
            [email]);

        if(qres.length > 0)
        {
            errors.email = 2;
            db.end();
            return res.json({ errors: { ...errors } });
        }
    }

    const sessionId = uuid();

    let [qres, fields] = await db.execute("INSERT INTO `users` (firstName, lastName, email, password, sessionId) VALUES(?, ?, ?, ?, ?);",
        [firstName, lastName, email, password, sessionId]);

    req.session.session_id = sessionId;
    req.session.user_id = qres.insertId;

    await db.execute("INSERT INTO `sessions` (id, sessionId) VALUES (?, ?);",
        [req.session.user_id, req.session.session_id]);

    await db.end();

    let user = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        sessionId: req.session.session_id,
        role: common.kDefaultRole,
        id: req.session.user_id,
        verified: 0
    };

    _sessions[sessionId] = user;

    await db.end();

    return res.json({
        user: user
    });
});

app.post('/verify_email/action', async (req, res) => {
    const { sessionId } = req.body;
    
    let user = await GetUser(sessionId, req);

    if(!user) {
        let db = await dbConnection();

        let [qres, fields] = await db.execute("SELECT * from `users` WHERE sessionId = ?;",
            [sessionId]);
        
        if(qres.length == 0) {
            return res.status(401).end();
        }

        user = GetUserFromResult(qres);

        console.log("/verify_email/action: user is null, selected from db");
    }

    user.verified = common.kUserVerified;

    let db = await dbConnection();

    let [qres, fields] = await db.execute("UPDATE `users` SET verified = ? WHERE sessionId = ?;",
        [user.verified, user.sessionId]);
        
    await db.end();

    console.log("/verify_email/action: verified " + user.email);

    return res.json({
        user: user
    });
});

app.post('/dashboard/profile', async (req, res) => {
    if(req.session.session_id && req.session.user_id)
    {
        let user = await GetUser(req.session.session_id, req);
        if(user) {
            return res.status(401).end();
        }
    }

    return res.status(401).end();
});

app.post('/events', (req, res) => {
    return res.json([{ title: 'title', price: 500 }]);
});

app.post('/logout', async (req, res) => {
    console.log("/logout: " + req.session.session_id);
    console.log("/logout: " + req.session.user_id);
    
    if(!req.session.session_id || !req.session.user_id) {
        console.log("/logout: !req.session.session_id || req.session.user_id");
        return res.json({});
    }

    let db = await dbConnection();

    /*let [qres, fields] = */
    await db.execute("DELETE FROM `sessions` WHERE sessionId = ? AND id = ?;",
        [req.session.session_id, req.session.user_id]);

    req.session.session_id = null;
    req.session.user_id = null;

    await db.end();
    console.log("/logout: success");
    return res.json({});
});

app.listen(settings.port || 8081, settings.host || '0.0.0.0', () => {
    console.log("Server started");
});



