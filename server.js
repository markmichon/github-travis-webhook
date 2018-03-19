var express = require("express")
var bodyParser = require("body-parser")
var axios = require("axios")
var app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post("/activate/:token", activate)

app.listen(3000, () => console.log("listening on port 3000!"))

function activate(req, res) {
  const token = req.params.token
  if (
    req.headers["x-github-event"] &&
    req.headers["x-github-event"] === "create"
  ) {
    // Sending initial status 200 back to avoid webhook timeout
    res.status("200").send("Activation attempt in progress")
    const reponame = encodeURIComponent(req.body.repository.full_name)
    getUserId(token)
      .then(id =>
        updateSyncStatus(token, id).then(data => {
          activateRepository(token, reponame)
        })
      )
      .catch(err =>
        console.log(
          "Error occurred while getting user ID. Token may be invalid"
        )
      )
  } else {
    res.status("200").send("Non-repository event; ignoring")
  }
}

function getUserId(token) {
  return axios({
    method: "get",
    url: `https://api.travis-ci.com/user`,
    headers: {
      Authorization: `token ${token}`,
      "Travis-API-Version": "3"
    }
  })
    .catch(err => console.log("error getting user id"))
    .then(res => {
      return res.data.id
    })
}

function updateSyncStatus(token, userId) {
  return axios({
    method: "post",
    headers: {
      Authorization: `token ${token}`,
      "Travis-API-Version": "3"
    },
    url: `https://api.travis-ci.com/user/${userId}/sync`
  })
    .catch(err => console.log("error syncing user: ", err))
    .then(res => res.data)
}

function isSyncing(token) {
  console.log("checking sync status")
  return axios({
    method: "get",
    url: `https://api.travis-ci.com/user`,
    headers: {
      Authorization: `token ${token}`,
      "Travis-API-Version": "3"
    }
  })
    .catch(err => console.log("error checking sync status"))
    .then(res => {
      console.log(res.data.is_syncing)
      return res.data.is_syncing
    })
}

async function activateRepository(token, reponame) {
  const syncing = await isSyncing(token)
  if (syncing) {
    console.log("Sync in progress")
    setTimeout(() => {
      activateRepository(token, reponame)
    }, 1000)
  } else {
    console.log("Sync complete, activating repo")
    return axios({
      method: "post",
      url: `https://api.travis-ci.com/repo/${reponame}/activate`,
      headers: {
        Authorization: `token ${token}`,
        "Travis-API-Version": "3"
      }
    })
      .catch(err => {
        if (err.reponse.data.error_type == "not_found") {
          console.log("Repo not found yet, retrying")
          setTimeout(() => {
            activateRepository(token, reponame)
          })
        }
      })
      .then(data => console.log("Repo successfully activated"))
  }
}
