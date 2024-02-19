const CronJob = require("cron").CronJob;

const script = require("./index");

new CronJob(
    process.env.HandDetailCronExpression,
    function () {
        script.removeAuditDataBeforeSevenDays();
    },
    null,
    true,
    process.env.TimeZone
);