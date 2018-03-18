var express = require("express");
var bodyParser = require("body-parser");
var axios = require('axios');
var app = express();
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
 

app.post('/activate/:token', activate)

app.listen(3000, () => console.log('Example app listening on port 3000!'))


function activate(req, res) {
  const token = req.params.token
  if (req.headers['x-github-event'] && req.headers['x-github-event'] === 'repository' && req.body.action && req.body.action === 'created') {
    const reponame = encodeURIComponent(req.body.repository.full_name)
    setTimeout( () => {
      getUserId(token)
      
      .then( id => updateSyncStatus(token, id)
            
            .then(() => {
        activateRepository(token, reponame)
          
          .then(data => {
          res.status('200').send('Repo updated')
        })
      })).catch( err => res.status('500').send('error'))
    }, 10000)
      
    } else {
      res.status('200').send('Non-repository event; ignoring')
    }
  

  
}

function getUserId(token) {
  return axios({
    method: 'get',
    url: `https://api.travis-ci.com/user`,
    headers: {
    Authorization: `token ${token}`,
     'Travis-API-Version': '3'
    }
  })
  .catch(err => console.log('error getting user id'))
  .then(res => {
    return res.data.id
  })
}

function updateSyncStatus(token, userId) {
    return axios({
      method: 'post',
      headers: {
    Authorization: `token ${token}`,
     'Travis-API-Version': '3'
    },
      url: `https://api.travis-ci.com/user/${userId}/sync`
    }).catch(err => console.log('error syncing user: ', err))
}

function activateRepository(token, reponame) { 
  return setTimeout( () => {
  return axios({
    method: 'post',
    url: `https://api.travis-ci.com/repo/${reponame}/activate`,
    headers: {
      Authorization: `token ${token}`,
     'Travis-API-Version': '3' } 
  }
  )
  .catch(err => console.log('Error activating repo'))  
  }, 3000)
  
}