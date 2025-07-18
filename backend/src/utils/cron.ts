import { CronJob } from "cron";
import https from "https";
import { VITE_API_URL } from "../config";

const job = new CronJob("*/14 * * * *", function () {
  if (!VITE_API_URL) {
    console.error("VITE_API_URL is not defined.");
    return;
  }

  https
    .get(VITE_API_URL, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
});

export default job;
