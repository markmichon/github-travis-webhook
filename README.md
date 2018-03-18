# Activate travis ci on repo creation

This is primarily for users of GitHub Classroom, but may benefit anyone using an org with private repos on GitHub. **Note:** This version only supports travis-ci.com accounts (private repos), and not .org free repos. Feel free to remix and roll your own version if you need .org support. The only change will be swapping the API calls in `server.js` to use .org rather than .com.

## The Problem

GitHub classroom generates repos when students accept an invite, and it's fairly easy to sync those repos up with Travis CI. The problem is that toggling Travis is a manual process. Some educators have gone around this by creating manual scripts that will toggle all repos matching a naming scheme, but this is still pretty tedius.

## The Solution

Webhooks! GitHub repos allow for webhooks, but so do Organizations on GitHub.

## Setup

First you'll need your Travis CI auth token. This can be retrieved by using the Travis ruby gem. Install it via the [instructions found here](https://github.com/travis-ci/travis.rb#installation), then generate a token as follows:

```
travis login --pro
travis token --pro
```

Next, create a new webhook from the settings page of your Organization `https://github.com/organizations/ORG_NAME/settings/hooks`.

The payload url will be the `https://github-to-travis.glitch.me/activate/YOUR_TOKEN_HERE`. Sub in the token retrieved in the previous step.

Under 'Which events would you like to trigger the webhook?' choose 'Let me select individual events' and check the 'Repositories' option. The rest can be unchecked.

Save and you're all set!

## Caveats

The Travis API is somewhat basic when it comes to feedback. As a result some assumptions and guessing goes into how long it takes certain actions to take place. If you notice activations failing, please let me know.

Not comfortable with the code as is? Remix your own on Glitch!

<!-- Remix Button -->

<a href="https://glitch.com/edit/#!/remix/github-to-travis">
  <img src="https://cdn.glitch.com/2bdfb3f8-05ef-4035-a06e-2043962a3a13%2Fremix%402x.png?1513093958726" alt="remix button" aria-label="remix" height="33">
</a>
