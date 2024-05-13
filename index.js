const express = require('express');
const webPush = require('web-push');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs'); // For file system access (to store subscriptions)

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

const keys = {
  "PublicKey": "BEAxVPVb72JDTuOy-jS7Qv9CIpkC-wilsr8gEd3-YMPnYWImyTMRP3iRNq5o3fhq4HDAnzI2FrRQH1hSdGjntPs",
  "PrivateKey": "TMxiFqjqhjT6R_6otAylSWs281SFAGpHlFTK15SloPM"
};

// Replace with your VAPID keys
const publicKey = keys.PublicKey;
const privateKey = keys.PrivateKey;
webPush.setVapidDetails('mailto:your-email@example.com', publicKey, privateKey);

const subscriptionsFile = 'subscriptions.json'; // File to store subscriptions

// Load subscriptions from file (if it exists)
let subscriptions = [];
try {
  const data = fs.readFileSync(subscriptionsFile);
  subscriptions = JSON.parse(data);
} catch (err) {
  console.error('Error loading subscriptions:', err);
}

// Save subscriptions to file
const saveSubscriptions = () => {
  fs.writeFileSync(subscriptionsFile, JSON.stringify(subscriptions));
};

// Function to check if a subscription already exists
const isDuplicateSubscription = (newSub) => {
  return subscriptions.some(
    (sub) => sub.endpoint === newSub.endpoint
  );
};

app.get('/', (req,res)=>{
  res.send('running')
}

// Handle subscription requests
app.post('/subscribe', (req, res) => {
  const { subscription } = req.body;

  if (isDuplicateSubscription(subscription)) {
    console.log('Subscription already exists:', subscription.endpoint);
  } else {
    console.log('Received subscription:', subscription.endpoint);
    subscriptions.push(subscription);
    saveSubscriptions();
  }

  res.status(201).json({});
});

// Send push notifications
app.post('/sendNotification', (req, res) => {
  const { notification } = req.body;

  if (!notification) {
    return res.status(400).json({ error: 'Notification data is required' });
  }

  // Send notification to each subscription
  subscriptions.forEach((subscription) => {
    if (subscription && subscription.endpoint) {
      webPush
        .sendNotification(subscription, JSON.stringify(notification))
        .then(() => console.log("Notification sent to:", subscription.endpoint))
        .catch((err) => console.error("Failed to send notification to:", subscription.endpoint, err));
    } else {
      console.error('Invalid subscription:', subscription);
    }
  });

  res.status(201).json({});
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
