const opn = require('opn')
const express = require('express')
const chalk = require('chalk')
const argv = require('minimist')(process.argv.slice(2))
const clipboardy = require('clipboardy')
const https = require('https');
const querystring = require('querystring');
const fs = require('fs');

const PORT = argv.port || 4815
const CLIENT_ID = fs.readFileSync('~/env/untracked/spotify.client_id', 'utf8').trim();
const CLIENT_SECRET = fs.readFileSync('~/env/untracked/spotify.client_secret', 'utf8').trim();
const SHOW_DIALOG = argv.showDialog || false
const SCOPE = argv.scope ? argv.scope.split(',').join('%20') : [
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'streaming',
  'ugc-image-upload',
  'user-follow-modify',
  'user-follow-read',
  'user-library-read',
  'user-library-modify',
  'user-read-private',
  'user-read-birthdate',
  'user-read-email',
  'user-top-read',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played'
].join('%20')

const REDIRECT_URI = 'http://localhost:' + PORT + '/callback'

const URL =
  'https://accounts.spotify.com/authorize'
  + '?client_id=' + CLIENT_ID
  + '&response_type=code'
  + '&scope=' + SCOPE
  + '&show_dialog=' + SHOW_DIALOG
  + '&redirect_uri=' + REDIRECT_URI

const app = express()

app.get('/callback', (req, res) => {
  res.sendFile(__dirname + '/callback.html')
  if (req.query.error) {
    console.log(chalk.red('Something went wrong. Error: '), req.query.error)
  }
})

app.get('/token', (req, res) => {
  res.sendStatus(200)
  const code = req.query.code
  if (code) {
    console.log(chalk.green('Received auth code.'));

    var postData = querystring.stringify({
      'grant_type' : 'authorization_code',
      'code': code,
      'redirect_uri': REDIRECT_URI,
      'client_id': CLIENT_ID,
      'client_secret': CLIENT_SECRET,
    });

    var options = {
        hostname: 'accounts.spotify.com',
        port: 443,
        path: '/api/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
            }
    };

    var req = https.request(options, (res) => {
      res.on('data', (data) => {
        console.log(`statusCode: ${res.statusCode}`);
        var response = JSON.parse(data);
        var refresh_token = response.refresh_token;
        console.log(chalk.green('Your refresh token is: '), chalk.bold(refresh_token))
        clipboardy.writeSync(refresh_token)
        process.exit()
      });
    });

    req.on('error', (error) => {
      console.error(error);
      process.exit()
    });

    req.write(postData)
    req.end();
  }
})

const main = () => {
  app.listen(PORT, () => {
    console.log(chalk.blue('Opening the Spotify Login Dialog in your browser...'))
    opn(URL)
  })
}

module.exports = main
