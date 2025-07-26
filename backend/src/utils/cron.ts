import { CronJob } from "cron";
import https from "https";

// Keep server alive by pinging itself every 14 minutes
const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;

const job = new CronJob("*/14 * * * *", function () {
  if (!API_URL) {
    console.error("API_URL is not defined.");
    return;
  }

  https
    .get(API_URL, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
});

export default job;
