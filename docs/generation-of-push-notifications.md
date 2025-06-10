# Generation of push notifications

To reduce battery usage, this app doesn't check Twitch or the updated GamesDoneQuick schedule on the users phone in the background. A dedicated backend handles these tasks and sends out push notifications to users instead.

Whenever a user selects a run, the phone subscribes to [a Firebase topic](https://firebase.google.com/docs/cloud-messaging/android/topic-messaging) like `run.1234`, where `1234` represents the `id` of the run from [the GamesDoneQuick API](https://tracker.gamesdonequick.com/tracker/api/v2/events/52/runs/).

The [dedicated backend](https://github.com/ViMaSter/gdqreminder-backend/) continuously checks for runs and sends a push notification to the Firebase topic on either of two conditions:
- the game on `twitch.tv/gamesdonequick` matches the game of a run
- the official GamesDoneQuick schedule via API has a run scheduled to start in 5 minutes

The [Google Play Store version of this app](https://play.google.com/store/apps/details?id=ke.mahn.gdqreminder) uses a firebase project maintained by @ViMaSter by default.

# Setting up a custom backend

If you want to make changes on how and when this app receives notifications, you need to run your own backend:

1. Follow [the backend setup instructions](https://github.com/ViMaSter/gdqreminder-backend?tab=readme-ov-file#quickstart-using-docker)
2. Open your Firebase project in a browser. Under `Project settings`, select `Add app`, select `Android`, then download `google-services.json`
3. Replace `/android/app/google-services.json` inside this repository with your generated `google-services.json`
4. Build and deploy the app to your phone. For reference steps, check the `prepareCache` and `buildAPK` jobs of the `/.github/workflows/buid.yml` GitHub Action