var express = require("express")
var bodyParser = require("body-parser")
var axios = require("axios")
var app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post("/activate/:token", activate)

app.listen(3000, () => console.log("listening on port 3000!"))

async function activate(req, res) {
  const token = req.params.token

  const api = axios.create({
    baseURL: "https://api.travis-ci.com",
    timeout: 10000,
    headers: {
      Authorization: `token ${token}`,
      "Travis-API-Version": "3"
    }
  })

  if (
    req.headers["x-github-event"] &&
    req.headers["x-github-event"] === "create"
  ) {
    // Sending initial status 200 back to avoid webhook timeout
    res.status("200").send("Activation attempt in progress")
    const reponame = encodeURIComponent(req.body.repository.full_name)
    const userId = await getUserId(api)
    await syncFlow(api, userId, reponame)
    activateRepository(api, reponame)
  } else {
    res.status("200").send("Non-repository event; ignoring")
  }
}

async function syncFlow(api, userId, reponame) {
  await updateSyncStatus(api, userId)
  await isSynced(api)
  const repoExists = await doesRepoExist(api, reponame)
  if (repoExists) {
    console.log("Repo exists in Travis CI")
    return true
  } else {
    await syncFlow(api, userId, reponame)
  }
}

function getUserId(api) {
  return api
    .get("/user")
    .then(res => res.data.id)
    .catch(err => console.log("error getting user id"))
}

function updateSyncStatus(api, userId) {
  return api
    .post(`/user/${userId}/sync`)
    .then(res => {
      return new Promise(resolve =>
        setTimeout(_ => {
          resolve(res.data)
        }, 3000)
      )
    })
    .catch(err => {
      console.log("error syncing user, retrying")
      return updateSyncStatus(api, userId)
    })
}

function isSynced(api) {
  return api
    .get("/user")
    .then(res => {
      if (res.data.is_syncing) {
        return new Promise(resolve =>
          setTimeout(_ => {
            console.log("Syncing")
            resolve(isSynced(api))
          }, 2000)
        )
      } else {
        console.log("Synced")
        return true
      }
    })
    .catch(err => {
      console.log("error checking sync status")
      return new Promise(resolve =>
        setTimeout(_ => {
          resolve(isSynced(api))
        }, 2000)
      )
    })
}

function activateRepository(api, reponame) {
  console.log("activating repo")
  return api
    .post(`/repo/${reponame}/activate`)
    .then(response => {
      console.log("Repo successfully activated")
      return true
    })
    .catch(err => {
      console.log("Error activating repository")
    })
}

function doesRepoExist(api, reponame) {
  console.log("Checking for repo")
  return api
    .get(`/repo/${reponame}`)
    .then(response => true)
    .catch(error => {
      return false
    })
}

function setBuildWithTravisOnly(token) {}
